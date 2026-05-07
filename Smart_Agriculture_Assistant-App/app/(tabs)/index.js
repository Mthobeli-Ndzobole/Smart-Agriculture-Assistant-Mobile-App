import React, { useCallback, useMemo, useState } from 'react';
import {
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
import { fetchAlertsSummary } from '../../services/alertService';
import { fetchDiseaseSummary } from '../../services/diseaseService';
import { fetchRecordSummary, fetchRecords } from '../../services/farmRecordService';
import { fetchMarketOverview } from '../../services/marketPriceService';

const formatActivityTitle = (item) => {
  if (item.record_type === 'crop') return item.crop_name || 'Crop activity';
  return item.animal_id ? `Livestock ${item.animal_id}` : 'Livestock activity';
};

export default function DashboardScreen() {
  const [records, setRecords] = useState([]);
  const [recordSummary, setRecordSummary] = useState(null);
  const [alertSummary, setAlertSummary] = useState(null);
  const [diseaseSummary, setDiseaseSummary] = useState(null);
  const [marketOverview, setMarketOverview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [recentRecords, farmStats, alerts, disease, market] = await Promise.all([
        fetchRecords(),
        fetchRecordSummary(),
        fetchAlertsSummary(),
        fetchDiseaseSummary(),
        fetchMarketOverview(),
      ]);

      setRecords(recentRecords.slice(0, 10));
      setRecordSummary(farmStats);
      setAlertSummary(alerts);
      setDiseaseSummary(disease);
      setMarketOverview(market);
    } catch (_error) {
      // Keep dashboard resilient even if a module fails.
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

  const kpis = useMemo(
    () => [
      { label: 'Farm Records', value: records.length },
      { label: 'Unread Alerts', value: alertSummary?.unread ?? 0 },
      { label: 'Market Entries', value: marketOverview?.records_count ?? 0 },
      { label: 'AI Scans', value: diseaseSummary?.total_scans ?? 0 },
    ],
    [records.length, alertSummary, marketOverview, diseaseSummary]
  );

  const renderRecord = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={styles.activityCard}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/AddEditRecord',
            params: { record: JSON.stringify(item) },
          })
        }
      >
        <Text style={styles.activityTitle}>{formatActivityTitle(item)}</Text>
        <Text style={styles.activityMeta}>{item.activity_type.replace('_', ' ')}</Text>
        <Text style={styles.activityMeta}>{new Date(item.date).toLocaleDateString()}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Smart Agriculture Assistant</Text>
        <Text style={styles.subtitle}>Operational overview across farm, market and AI modules</Text>
      </View>

      <View style={styles.kpiGrid}>
        {kpis.map((item, index) => (
          <Animated.View key={item.label} entering={FadeInDown.delay(index * 90).springify()} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{item.label}</Text>
            <Text style={styles.kpiValue}>{item.value}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.summaryStrip}>
        <Text style={styles.summaryText}>Harvest {Number(recordSummary?.total_harvest_kg || 0).toFixed(1)} kg</Text>
        <Text style={styles.summaryText}>Input {Number(recordSummary?.total_input_used || 0).toFixed(1)}</Text>
        <Text style={styles.summaryText}>Livestock Loss {recordSummary?.total_deaths || 0}</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRecord}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Recent Activities</Text>}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No records yet. Add your first one.</Text> : null}
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
    margin: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#27483A',
    ...theme.shadow,
  },
  title: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '900',
  },
  subtitle: {
    color: '#D4F1E1',
    marginTop: 4,
    fontWeight: '600',
  },
  kpiGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    width: '48.8%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    ...theme.shadow,
  },
  kpiLabel: {
    color: '#5A6C61',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiValue: {
    marginTop: 6,
    color: '#1C4030',
    fontSize: 24,
    fontWeight: '900',
  },
  summaryStrip: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#E4F1E9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: {
    fontSize: 11,
    color: '#244936',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: '#27483A',
    fontSize: 17,
    fontWeight: '900',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
    ...theme.shadow,
  },
  activityTitle: {
    color: '#1D3D2F',
    fontWeight: '800',
    fontSize: 15,
  },
  activityMeta: {
    marginTop: 4,
    color: '#5B6C62',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#607067',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 26,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow,
  },
  fabText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 30,
    marginTop: -2,
  },
});
