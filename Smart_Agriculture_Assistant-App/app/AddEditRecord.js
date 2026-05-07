import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { createRecord, updateRecord, queueOfflineRecord } from '../services/farmRecordService';

const CROP_ACTIVITIES    = ['planting','fertilizing','pest_control','harvest','other'];
const LIVESTOCK_ACTIVITIES = ['feeding','health_treatment','breeding','death','other'];

const ACTIVITY_LABELS = {
  planting:         '🌱 Planting',
  fertilizing:      '🧪 Fertilizing',
  pest_control:     '🐛 Pest Control',
  harvest:          '🌾 Harvest',
  feeding:          '🍃 Feeding',
  health_treatment: '💉 Health Treatment',
  breeding:         '🐄 Breeding / Calving',
  death:            '⚰️ Death Loss',
  other:            '📝 Other',
};

export default function AddEditRecord() {
  const params   = useLocalSearchParams();
  const recordParam = Array.isArray(params.record) ? params.record[0] : params.record;
  const existing = recordParam ? JSON.parse(recordParam) : null;
  const isEditing = !!existing;

  // ── Shared state ───────────────────────────────────────────────
  const [recordType,    setRecordType]    = useState(existing?.record_type    || 'crop');
  const [activityType,  setActivityType]  = useState(existing?.activity_type  || 'planting');
  const [date,          setDate]          = useState(existing?.date ? new Date(existing.date) : new Date());
  const [showDatePicker,setShowDatePicker]= useState(false);
  const [inputUsed,     setInputUsed]     = useState(existing?.input_used     || '');
  const [inputAmount,   setInputAmount]   = useState(existing?.input_amount?.toString() || '');
  const [inputUnit,     setInputUnit]     = useState(existing?.input_unit     || 'kg');
  const [notes,         setNotes]         = useState(existing?.notes          || '');
  const [loading,       setLoading]       = useState(false);

  // ── Crop state ─────────────────────────────────────────────────
  const [cropName,      setCropName]      = useState(existing?.crop_name      || '');
  const [cropVariety,   setCropVariety]   = useState(existing?.crop_variety   || '');
  const [fieldName,     setFieldName]     = useState(existing?.field_name     || '');
  const [plantingDate,  setPlantingDate]  = useState(existing?.planting_date ? new Date(existing.planting_date) : null);
  const [showPlanting,  setShowPlanting]  = useState(false);
  const [harvestWeight, setHarvestWeight] = useState(existing?.harvest_weight?.toString() || '');

  // ── Livestock state ────────────────────────────────────────────
  const [animalId,      setAnimalId]      = useState(existing?.animal_id      || '');
  const [animalType,    setAnimalType]    = useState(existing?.animal_type    || 'Cattle');
  const [animalAge,     setAnimalAge]     = useState(existing?.animal_age?.toString() || '');
  const [animalSex,     setAnimalSex]     = useState(existing?.animal_sex     || '');
  const [weightKg,      setWeightKg]      = useState(existing?.weight_kg?.toString() || '');
  const [breedingHistory,setBreedingHistory] = useState(existing?.breeding_history || '');
  const [healthNotes,   setHealthNotes]   = useState(existing?.health_notes   || '');
  const [deathLoss,     setDeathLoss]     = useState(existing?.death_loss     || false);

  // Reset activity when type toggles
  useEffect(() => {
    setActivityType(recordType === 'crop' ? 'planting' : 'feeding');
  }, [recordType]);

  const activities = recordType === 'crop' ? CROP_ACTIVITIES : LIVESTOCK_ACTIVITIES;

  const handleSave = async () => {
    if (recordType === 'crop' && !cropName.trim()) {
      Alert.alert('Validation', 'Crop name is required'); return;
    }
    if (recordType === 'livestock' && !animalId.trim()) {
      Alert.alert('Validation', 'Animal ID / Tag is required'); return;
    }

    const payload = {
      record_type:   recordType,
      activity_type: activityType,
      date:          date.toISOString().split('T')[0],
      input_used:    inputUsed   || null,
      input_amount:  inputAmount ? parseFloat(inputAmount) : null,
      input_unit:    inputUnit   || null,
      notes,
      ...(recordType === 'crop' ? {
        crop_name:      cropName,
        crop_variety:   cropVariety   || null,
        field_name:     fieldName     || null,
        planting_date:  plantingDate  ? plantingDate.toISOString().split('T')[0] : null,
        harvest_weight: harvestWeight ? parseFloat(harvestWeight) : null,
      } : {
        animal_id:        animalId,
        animal_type:      animalType      || null,
        animal_age:       animalAge       ? parseInt(animalAge) : null,
        animal_sex:       animalSex       || null,
        weight_kg:        weightKg        ? parseFloat(weightKg) : null,
        breeding_history: breedingHistory || null,
        health_notes:     healthNotes     || null,
        death_loss:       deathLoss,
      }),
    };

    setLoading(true);
    try {
      if (isEditing) {
        await updateRecord(existing.id, payload);
      } else {
        await createRecord(payload);
      }
      router.back();
    } catch (_err) {
      await queueOfflineRecord(payload, isEditing ? 'UPDATE' : 'CREATE');
      Alert.alert('Offline', 'Saved locally. Will sync when online.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>{isEditing ? 'Edit Record' : 'New Farm Record'}</Text>

      {/* Record Type Toggle */}
      <Text style={styles.label}>Record Type</Text>
      <View style={styles.toggleRow}>
        {['crop','livestock'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.toggleBtn, recordType === type && styles.toggleActive]}
            onPress={() => setRecordType(type)}
          >
            <Text style={[styles.toggleText, recordType === type && styles.toggleTextActive]}>
              {type === 'crop' ? '🌾 Crop' : '🐄 Livestock'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity Type */}
      <Text style={styles.label}>Activity</Text>
      <View style={styles.picker}>
        <Picker selectedValue={activityType} onValueChange={setActivityType}>
          {activities.map(a => (
            <Picker.Item key={a} label={ACTIVITY_LABELS[a]} value={a} />
          ))}
        </Picker>
      </View>

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
        <Text>📅 {date.toISOString().split('T')[0]}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" onChange={(_, d) => {
          setShowDatePicker(false); if (d) setDate(d);
        }} />
      )}

      {/* ── CROP FIELDS ─────────────────────────────────────── */}
      {recordType === 'crop' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Crop Details</Text>

          <Text style={styles.label}>Crop Name *</Text>
          <TextInput style={styles.input} value={cropName} onChangeText={setCropName} placeholder="e.g. Maize, Tomatoes" />

          <Text style={styles.label}>Variety</Text>
          <TextInput style={styles.input} value={cropVariety} onChangeText={setCropVariety} placeholder="e.g. Pioneer 30Y87" />

          <Text style={styles.label}>Field / Block Name</Text>
          <TextInput style={styles.input} value={fieldName} onChangeText={setFieldName} placeholder="e.g. North Block" />

          <Text style={styles.label}>Planting Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPlanting(true)}>
            <Text>📅 {plantingDate ? plantingDate.toISOString().split('T')[0] : 'Not set'}</Text>
          </TouchableOpacity>
          {showPlanting && (
            <DateTimePicker value={plantingDate || new Date()} mode="date" onChange={(_, d) => {
              setShowPlanting(false); if (d) setPlantingDate(d);
            }} />
          )}

          {activityType === 'harvest' && (
            <>
              <Text style={styles.label}>Harvest Weight (kg)</Text>
              <TextInput style={styles.input} value={harvestWeight} onChangeText={setHarvestWeight}
                keyboardType="numeric" placeholder="e.g. 2500" />
            </>
          )}
        </View>
      )}

      {/* ── LIVESTOCK FIELDS ─────────────────────────────────── */}
      {recordType === 'livestock' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐄 Livestock Details</Text>

          <Text style={styles.label}>Tag / Animal ID *</Text>
          <TextInput style={styles.input} value={animalId} onChangeText={setAnimalId} placeholder="e.g. TAG-1023" />

          <Text style={styles.label}>Animal Type</Text>
          <View style={styles.picker}>
            <Picker selectedValue={animalType} onValueChange={setAnimalType}>
              {['Cattle','Sheep','Goat','Pig','Chicken','Other'].map(a => (
                <Picker.Item key={a} label={a} value={a} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Sex</Text>
          <View style={styles.sexRow}>
            {['M','F','Unknown'].map(s => (
              <TouchableOpacity key={s}
                style={[styles.sexBtn, animalSex === s && styles.sexActive]}
                onPress={() => setAnimalSex(s)}
              >
                <Text style={animalSex === s ? styles.sexTextActive : null}>
                  {s === 'M' ? 'Male' : s === 'F' ? 'Female' : 'Unknown'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Age (months)</Text>
          <TextInput style={styles.input} value={animalAge} onChangeText={setAnimalAge}
            keyboardType="numeric" placeholder="e.g. 18" />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} value={weightKg} onChangeText={setWeightKg}
            keyboardType="numeric" placeholder="e.g. 450" />

          {activityType === 'health_treatment' && (
            <>
              <Text style={styles.label}>Health / Treatment Notes</Text>
              <TextInput style={[styles.input, styles.area]} value={healthNotes}
                onChangeText={setHealthNotes} multiline placeholder="Vaccine, dosage, vet notes..." />
            </>
          )}

          {activityType === 'breeding' && (
            <>
              <Text style={styles.label}>Breeding / Calving Notes</Text>
              <TextInput style={[styles.input, styles.area]} value={breedingHistory}
                onChangeText={setBreedingHistory} multiline placeholder="Calving date, sire, offspring..." />
            </>
          )}

          {activityType === 'death' && (
            <View style={styles.switchRow}>
              <Text style={styles.label}>Mark as Death Loss</Text>
              <Switch value={deathLoss} onValueChange={setDeathLoss} trackColor={{ true: '#4CAF50' }} />
            </View>
          )}
        </View>
      )}

      {/* ── INPUT USAGE (shared) ─────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Input Usage</Text>
        <Text style={styles.label}>Input Name</Text>
        <TextInput style={styles.input} value={inputUsed} onChangeText={setInputUsed}
          placeholder="e.g. Urea, Herbicide X, Lick" />
        <View style={styles.row}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <Text style={styles.label}>Amount</Text>
            <TextInput style={styles.input} value={inputAmount} onChangeText={setInputAmount}
              keyboardType="numeric" placeholder="e.g. 50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.picker}>
              <Picker selectedValue={inputUnit} onValueChange={setInputUnit}>
                {['kg','litres','bags','tonnes','units'].map(u => (
                  <Picker.Item key={u} label={u} value={u} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.area]} value={notes}
        onChangeText={setNotes} multiline placeholder="Any additional details..." />

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave} disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveBtnText}>{isEditing ? 'Update Record' : 'Save Record'}</Text>
        }
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header:          { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#2d5a2c' },
  label:           { fontWeight: '600', marginTop: 10, marginBottom: 4, color: '#333' },
  input:           { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15 },
  area:            { minHeight: 80, textAlignVertical: 'top' },
  picker:          { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 4 },
  dateBtn:         { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 4 },
  toggleRow:       { flexDirection: 'row', gap: 10, marginBottom: 8 },
  toggleBtn:       { flex: 1, padding: 12, backgroundColor: '#e0e0e0', borderRadius: 8, alignItems: 'center' },
  toggleActive:    { backgroundColor: '#4CAF50' },
  toggleText:      { color: '#555', fontWeight: '600' },
  toggleTextActive:{ color: '#fff', fontWeight: 'bold' },
  section:         { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 14 },
  sectionTitle:    { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#2d5a2c' },
  sexRow:          { flexDirection: 'row', gap: 8, marginBottom: 8 },
  sexBtn:          { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#eee', borderRadius: 20 },
  sexActive:       { backgroundColor: '#4CAF50' },
  sexTextActive:   { color: '#fff', fontWeight: 'bold' },
  switchRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  row:             { flexDirection: 'row' },
  saveBtn:         { backgroundColor: '#4CAF50', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { backgroundColor: '#aaa' },
  saveBtnText:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
