import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { theme } from '../constants/appTheme';
import {
  createCropLog,
  fetchCropLogById,
  updateCropLog,
} from '../services/cropLogService';

export default function AddCropLogScreen() {
  const { id } = useLocalSearchParams();
  const logId = Array.isArray(id) ? id[0] : id;
  const isEditing = Boolean(logId);

  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [expectedHarvest, setExpectedHarvest] = useState(new Date());
  const [status, setStatus] = useState('planted');
  const [area, setArea] = useState('');
  const [yieldKg, setYieldKg] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(isEditing);
  const [showPlantingPicker, setShowPlantingPicker] = useState(false);
  const [showHarvestPicker, setShowHarvestPicker] = useState(false);

  useEffect(() => {
    const loadCrop = async () => {
      if (!isEditing) return;
      try {
        const item = await fetchCropLogById(logId);
        setCropName(item.crop_name || '');
        setVariety(item.variety || '');
        if (item.planting_date) setPlantingDate(new Date(item.planting_date));
        if (item.expected_harvest_date) setExpectedHarvest(new Date(item.expected_harvest_date));
        setStatus(item.status || 'planted');
        setArea(item.area_planted_hectares ? String(item.area_planted_hectares) : '');
        setYieldKg(item.actual_yield_kg ? String(item.actual_yield_kg) : '');
        setNotes(item.notes || '');
      } catch (_error) {
        Alert.alert('Error', 'Could not load crop log.');
      } finally {
        setScreenLoading(false);
      }
    };
    loadCrop();
  }, [logId, isEditing]);

  const handleSave = async () => {
    if (!cropName.trim()) {
      Alert.alert('Validation', 'Crop name is required.');
      return;
    }

    const payload = {
      crop_name: cropName.trim(),
      variety: variety.trim() || null,
      planting_date: plantingDate.toISOString().split('T')[0],
      expected_harvest_date: expectedHarvest.toISOString().split('T')[0],
      status,
      area_planted_hectares: area ? Number(area) : null,
      actual_yield_kg: yieldKg ? Number(yieldKg) : null,
      notes: notes.trim() || null,
    };

    setLoading(true);
    try {
      if (isEditing) {
        await updateCropLog(logId, payload);
      } else {
        await createCropLog(payload);
      }
      router.back();
    } catch (_error) {
      Alert.alert('Error', 'Could not save crop log.');
    } finally {
      setLoading(false);
    }
  };

  if (screenLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>{isEditing ? 'Edit Crop Log' : 'Add Crop Log'}</Text>

        <Text style={styles.label}>Crop Name *</Text>
        <TextInput style={styles.input} value={cropName} onChangeText={setCropName} placeholder="Maize, Tomato..." />

        <Text style={styles.label}>Variety</Text>
        <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="Hybrid / cultivar" />

        <Text style={styles.label}>Planting Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPlantingPicker(true)}>
          <Text>{plantingDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showPlantingPicker && (
          <DateTimePicker
            value={plantingDate}
            mode="date"
            onChange={(_event, dateValue) => {
              setShowPlantingPicker(false);
              if (dateValue) setPlantingDate(dateValue);
            }}
          />
        )}

        <Text style={styles.label}>Expected Harvest</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowHarvestPicker(true)}>
          <Text>{expectedHarvest.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showHarvestPicker && (
          <DateTimePicker
            value={expectedHarvest}
            mode="date"
            onChange={(_event, dateValue) => {
              setShowHarvestPicker(false);
              if (dateValue) setExpectedHarvest(dateValue);
            }}
          />
        )}

        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={status} onValueChange={setStatus}>
            <Picker.Item label="Planted" value="planted" />
            <Picker.Item label="Growing" value="growing" />
            <Picker.Item label="Harvested" value="harvested" />
            <Picker.Item label="Failed" value="failed" />
          </Picker>
        </View>

        <Text style={styles.label}>Area Planted (ha)</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={area} onChangeText={setArea} />

        <Text style={styles.label}>Actual Yield (kg)</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={yieldKg} onChangeText={setYieldKg} />

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} multiline />

        <TouchableOpacity style={[styles.saveButton, loading && styles.disabled]} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveText}>{loading ? 'Saving...' : isEditing ? 'Update Log' : 'Save Log'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  header: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 14,
  },
  label: {
    fontWeight: '700',
    color: '#334941',
    marginBottom: 5,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4E3DA',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#D4E3DA',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#D4E3DA',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.7,
  },
});
