import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/appTheme';
import { deleteCropLog, fetchCropLogs } from '../../services/cropLogService';

const statusColors = {
  planted: '#1D4ED8',
  growing: '#15803D',
  harvested: '#B45309',
  failed: '#B91C1C',
};

export default function CropLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchCropLogs();
      setLogs(data);
    } catch (_error) {
      Alert.alert('Error', 'Could not load crop logs.');
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

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((item) => {
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      const textMatch =
        !q ||
        (item.crop_name || '').toLowerCase().includes(q) ||
        (item.variety || '').toLowerCase().includes(q);
      return statusMatch && textMatch;
    });
  }, [logs, search, statusFilter]);

  const removeLog = (item) => {
    Alert.alert('Delete crop log', `Delete "${item.crop_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCropLog(item.id);
            loadData();
          } catch (_error) {
            Alert.alert('Error', 'Could not delete crop log.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={styles.logCard}>
      <TouchableOpacity onPress={() => router.push({ pathname: '/AddCropLog', params: { id: item.id } })}>
        <View style={styles.rowBetween}>
          <Text style={styles.logTitle}>
            {item.crop_name}
            {item.variety ? ` (${item.variety})` : ''}
          </Text>
          <TouchableOpacity onPress={() => removeLog(item)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.metaText}>Planted {new Date(item.planting_date).toLocaleDateString()}</Text>
        {item.expected_harvest_date ? (
          <Text style={styles.metaText}>Expected {new Date(item.expected_harvest_date).toLocaleDateString()}</Text>
        ) : null}
        <View style={styles.rowBetween}>
          <Text style={styles.metaText}>Area {item.area_planted_hectares || 0} ha</Text>
          <Text style={[styles.statusPill, { color: statusColors[item.status] || '#334155', borderColor: statusColors[item.status] || '#CBD5E1' }]}>
            {item.status}
          </Text>
        </View>
        {item.actual_yield_kg ? <Text style={styles.metaText}>Yield {item.actual_yield_kg} kg</Text> : null}
        {item.notes ? <Text style={styles.note}>{item.notes}</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.heading}>Crop Logs</Text>
        <Text style={styles.subheading}>Track planting cycles and harvest progress</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by crop or variety"
        />
      </View>

      <View style={styles.filters}>
        {['all', 'planted', 'growing', 'harvested', 'failed'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterChip, statusFilter === item && styles.filterChipActive]}
            onPress={() => setStatusFilter(item)}
          >
            <Text style={statusFilter === item ? styles.filterTextActive : styles.filterText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No crop logs found.</Text> : null}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/AddCropLog')}>
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
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#27483A',
    ...theme.shadow,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  subheading: {
    color: '#D8EEDB',
    marginTop: 4,
    fontWeight: '600',
  },
  searchWrap: {
    marginHorizontal: 16,
  },
  searchInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5E3D7',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  filters: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#E8F0EA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: '#2F5D38',
  },
  filterText: {
    color: '#34533C',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 12,
    marginBottom: 10,
    ...theme.shadow,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logTitle: {
    color: '#1D4A27',
    fontWeight: '900',
    fontSize: 15,
    flex: 1,
    paddingRight: 8,
  },
  metaText: {
    marginTop: 4,
    color: '#5A6C60',
    fontWeight: '600',
  },
  deleteText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 12,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
    overflow: 'hidden',
  },
  note: {
    marginTop: 6,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  empty: {
    textAlign: 'center',
    color: '#607167',
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 26,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3E7049',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow,
  },
  fabText: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '900',
    marginTop: -2,
  },
});
