import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/appTheme';
import { deleteRecord, fetchRecords, fetchRecordSummary } from '../../services/farmRecordService';

const seasonLabels = {
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
  spring: 'Spring',
};

export default function FarmRecordsScreen() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [recordData, summaryData] = await Promise.all([fetchRecords(), fetchRecordSummary()]);
      setRecords(recordData);
      setSummary(summaryData);
    } catch (_error) {
      // Avoid blocking the full screen if one endpoint fails.
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

  const yearlyRows = useMemo(() => Object.entries(summary?.yearly_summary || {}), [summary]);

  const onDelete = (id) => {
    Alert.alert('Delete record', 'Remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(id);
            loadData();
          } catch (_error) {
            Alert.alert('Error', 'Could not delete record.');
          }
        },
      },
    ]);
  };

  const renderRecord = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.recordCard}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/AddEditRecord',
            params: { record: JSON.stringify(item) },
          })
        }
      >
        <Text style={styles.recordTitle}>
          {item.record_type === 'crop' ? item.crop_name || 'Crop record' : item.animal_id || 'Livestock record'}
        </Text>
        <Text style={styles.metaText}>{item.activity_type.replace('_', ' ')}</Text>
        <Text style={styles.metaText}>
          {new Date(item.date).toLocaleDateString()} • {seasonLabels[item.season] || item.season}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deletePill}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Farm Records Analytics</Text>
        <Text style={styles.subtitle}>Crop and livestock activity insights</Text>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Harvest (kg)</Text>
          <Text style={styles.kpiValue}>{Number(summary?.total_harvest_kg || 0).toFixed(1)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Input Used</Text>
          <Text style={styles.kpiValue}>{Number(summary?.total_input_used || 0).toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Livestock Born</Text>
          <Text style={styles.kpiValue}>{summary?.livestock_born || 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Losses</Text>
          <Text style={styles.kpiValue}>{summary?.total_deaths || 0}</Text>
        </View>
      </View>

      <View style={styles.yearlyCard}>
        <Text style={styles.yearlyHeading}>Yearly Crop Summary</Text>
        {yearlyRows.length === 0 ? (
          <Text style={styles.empty}>No yearly data yet.</Text>
        ) : (
          yearlyRows.map(([year, row]) => (
            <View key={year} style={styles.yearlyRow}>
              <Text style={styles.year}>{year}</Text>
              <Text style={styles.yearMeta}>{Number(row.harvest_kg).toFixed(1)} kg</Text>
              <Text style={styles.yearMeta}>{Number(row.input_kg).toFixed(1)} input</Text>
              <Text style={styles.yearMeta}>{row.crop_activities} activities</Text>
            </View>
          ))
        )}
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRecord}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.sectionTitle}>All Records</Text>}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No records found.</Text> : null}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/AddEditRecord')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#27483A',
    ...theme.shadow,
  },
  title: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '900',
  },
  subtitle: {
    color: '#D4F0E6',
    marginTop: 4,
    fontWeight: '600',
  },
  kpiRow: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    ...theme.shadow,
  },
  kpiLabel: {
    color: '#5A6A61',
    fontWeight: '700',
    fontSize: 12,
  },
  kpiValue: {
    marginTop: 4,
    color: '#1D5A48',
    fontSize: 20,
    fontWeight: '900',
  },
  yearlyCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    ...theme.shadow,
  },
  yearlyHeading: {
    color: '#1A4838',
    fontWeight: '900',
    marginBottom: 8,
  },
  yearlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  year: {
    width: 44,
    color: '#1A4838',
    fontWeight: '800',
  },
  yearMeta: {
    color: '#55675D',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: '#1A4838',
    fontWeight: '900',
    fontSize: 16,
  },
  recordCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    ...theme.shadow,
  },
  recordTitle: {
    color: '#1D4A3A',
    fontSize: 15,
    fontWeight: '800',
  },
  metaText: {
    marginTop: 3,
    color: '#5C6A63',
    fontWeight: '600',
  },
  deletePill: {
    marginTop: 9,
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  deleteText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    color: '#627067',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 26,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1E6B57',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow,
  },
  fabText: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '900',
    marginTop: -2,
  },
});
