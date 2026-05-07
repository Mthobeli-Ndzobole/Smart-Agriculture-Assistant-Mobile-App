import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/appTheme';
import {
  deleteDiseaseScan,
  fetchDiseaseScans,
  fetchDiseaseSummary,
  uploadDiseaseScan,
} from '../../services/diseaseService';

const riskColors = {
  low: '#15803D',
  medium: '#1D4ED8',
  high: '#B45309',
  critical: '#B91C1C',
};

export default function DiseaseDetectionScreen() {
  const [cropName, setCropName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [scans, setScans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [scanData, summaryData] = await Promise.all([fetchDiseaseScans(), fetchDiseaseSummary()]);
      setScans(scanData);
      setSummary(summaryData);
    } catch (_error) {
      Alert.alert('Error', 'Could not load scan history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to continue.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const captureImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to continue.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const submitScan = async () => {
    if (!selectedImage) {
      Alert.alert('Validation', 'Select or capture an image first.');
      return;
    }

    setSubmitting(true);
    try {
      await uploadDiseaseScan({ imageUri: selectedImage, cropName, notes });
      setCropName('');
      setNotes('');
      setSelectedImage('');
      loadData();
    } catch (_error) {
      Alert.alert('Error', 'Could not analyze image.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteScan = (item) => {
    Alert.alert('Delete scan', `Delete ${item.disease_name} result?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDiseaseScan(item.id);
            loadData();
          } catch (_error) {
            Alert.alert('Error', 'Could not delete scan.');
          }
        },
      },
    ]);
  };

  const renderScan = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.scanCard}>
      <View style={styles.scanTopRow}>
        <Text style={styles.scanTitle}>{item.crop_name || 'Unknown crop'}</Text>
        <TouchableOpacity onPress={() => onDeleteScan(item)}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
      <Text style={styles.scanDisease}>{item.disease_name}</Text>
      <View style={styles.row}>
        <Text style={styles.scanMeta}>Confidence: {(Number(item.confidence) * 100).toFixed(1)}%</Text>
        <Text
          style={[
            styles.riskTag,
            { color: riskColors[item.risk_level] || '#334155', borderColor: riskColors[item.risk_level] || '#CBD5E1' },
          ]}
        >
          {item.risk_level}
        </Text>
      </View>
      <Text style={styles.recommendation}>{item.recommendation}</Text>
      <Text style={styles.scanMeta}>{new Date(item.created_at).toLocaleString()}</Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.heading}>AI Crop Disease Detection</Text>
        <Text style={styles.subheading}>Capture leaf images and get instant recommendations</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Scans</Text>
          <Text style={styles.summaryValue}>{summary?.total_scans ?? 0}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>High/Critical</Text>
          <Text style={styles.summaryValue}>
            {(summary?.risk_breakdown?.high || 0) + (summary?.risk_breakdown?.critical || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>New Scan</Text>
        <TextInput
          style={styles.input}
          placeholder="Crop name (e.g. maize)"
          value={cropName}
          onChangeText={setCropName}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional symptoms/notes"
          value={notes}
          multiline
          onChangeText={setNotes}
        />
        {selectedImage ? <Image source={{ uri: selectedImage }} style={styles.preview} /> : null}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
            <Text style={styles.secondaryText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={captureImage}>
            <Text style={styles.secondaryText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={submitScan} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Analyzing...' : 'Analyze'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderScan}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No scan history yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    margin: 16,
    marginBottom: 10,
    backgroundColor: '#27483A',
    borderRadius: 18,
    padding: 16,
    ...theme.shadow,
  },
  heading: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
  },
  subheading: {
    color: '#27483A',
    marginTop: 4,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    ...theme.shadow,
  },
  summaryLabel: {
    color: '#27483A',
    fontWeight: '700',
    fontSize: 12,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 20,
    color: '#27483A',
    fontWeight: '900',
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
    ...theme.shadow,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2E4278',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5DDEE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#F7F9FF',
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
  },
  secondaryText: {
    color: '#334E99',
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.3,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#334E99',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...theme.shadow,
  },
  scanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanTitle: {
    color: '#3D5A98',
    fontWeight: '800',
  },
  scanDisease: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900',
    color: '#1E2E52',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  scanMeta: {
    color: '#5F6B84',
    fontWeight: '600',
    marginTop: 6,
  },
  recommendation: {
    marginTop: 8,
    color: '#31415C',
    lineHeight: 18,
  },
  riskTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
    overflow: 'hidden',
  },
  empty: {
    textAlign: 'center',
    marginTop: 28,
    color: '#6B7280',
  },
});
