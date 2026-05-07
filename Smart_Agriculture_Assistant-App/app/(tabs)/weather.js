import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/appTheme';
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchWeatherAlert,
  reverseGeocode,
  searchLocations,
} from '../../services/weatherService';

const STORAGE_KEY = 'saved_weather_locations';

const weatherIcon = (condition = '') => {
  const c = condition.toLowerCase();
  if (c.includes('rain')) return 'rainy';
  if (c.includes('cloud')) return 'cloud';
  if (c.includes('storm') || c.includes('thunder')) return 'thunderstorm';
  if (c.includes('snow')) return 'snow';
  return 'sunny';
};

export default function WeatherScreen() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('daily');
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [alertData, setAlertData] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);

  useEffect(() => {
    const loadSaved = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSavedLocations(JSON.parse(raw));
    };
    loadSaved();
  }, []);

  const persistSaved = async (locations) => {
    setSavedLocations(locations);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  };

  const fetchAll = async (lat, lon, cityOverride = '') => {
    setLoading(true);
    setError('');
    try {
      const [currentData, forecastData, weatherAlert] = await Promise.all([
        fetchCurrentWeather(lat, lon),
        fetchForecast(lat, lon),
        fetchWeatherAlert(lat, lon),
      ]);

      setCurrent({ ...currentData, city: cityOverride || currentData.city });
      setHourly((forecastData?.hourly || []).slice(0, 12));
      setDaily((forecastData?.daily || []).slice(0, 5));
      setAlertData(weatherAlert);
    } catch (_error) {
      setError('Could not fetch weather data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const results = await searchLocations(query.trim());
      setSuggestions(results);
      if (!results.length) setError('No results found.');
    } catch (_error) {
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const onSelectSuggestion = async (item) => {
    setSuggestions([]);
    setQuery('');
    await fetchAll(item.lat, item.lon, item.name);
  };

  const onUseCurrentLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError('Location permission was denied.');
      return;
    }

    const pos = await Location.getCurrentPositionAsync({});
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    try {
      const nameData = await reverseGeocode(lat, lon);
      await fetchAll(lat, lon, nameData?.name || '');
    } catch (_error) {
      await fetchAll(lat, lon);
    }
  };

  const saveCurrent = async () => {
    if (!current) return;
    const exists = savedLocations.some((item) => item.lat === current.lat && item.lon === current.lon);
    if (exists) return;
    const next = [
      ...savedLocations,
      {
        id: `${current.lat}_${current.lon}`,
        city: current.city,
        country: current.country,
        lat: current.lat,
        lon: current.lon,
      },
    ];
    persistSaved(next);
  };

  const removeSaved = async (itemId) => {
    const next = savedLocations.filter((item) => item.id !== itemId);
    persistSaved(next);
  };

  const onRefresh = async () => {
    if (!current) return;
    setRefreshing(true);
    await fetchAll(current.lat, current.lon, current.city);
  };

  const weatherTitle = useMemo(() => {
    if (!current) return 'Weather';
    return `${current.city}, ${current.country}`;
  }, [current]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Smart Weather</Text>
          <Text style={styles.subheading}>Field-ready climate insights for your farm</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            placeholder="Search city or town"
            placeholderTextColor="#7D8983"
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.iconBtn} onPress={onSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={onUseCurrentLocation}>
            <Ionicons name="locate" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((item, index) => (
              <TouchableOpacity key={`${item.lat}_${item.lon}_${index}`} style={styles.suggestionItem} onPress={() => onSelectSuggestion(item)}>
                <Text style={styles.suggestionText}>
                  {item.name}, {item.country}
                  {item.state ? ` (${item.state})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 14 }} /> : null}

        {current ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.currentCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.cityText}>{weatherTitle}</Text>
              <Ionicons name={weatherIcon(current.condition)} size={28} color="#F7B731" />
            </View>
            <Text style={styles.tempText}>{Math.round(current.temp_c)} C</Text>
            <Text style={styles.conditionText}>{current.condition}</Text>
            <View style={styles.metricsRow}>
              <Text style={styles.metric}>Humidity {current.humidity}%</Text>
              <Text style={styles.metric}>Wind {current.wind_speed} km/h</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveCurrent}>
              <Text style={styles.saveBtnText}>Save Location</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {alertData ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertHeadline}>{alertData.headline || 'Weather Alert'}</Text>
            <Text style={styles.alertBody}>{alertData.description || 'No active alerts.'}</Text>
          </View>
        ) : null}

        {(hourly.length > 0 || daily.length > 0) && (
          <>
            <View style={styles.tabRow}>
              <TouchableOpacity style={[styles.tab, tab === 'hourly' && styles.tabActive]} onPress={() => setTab('hourly')}>
                <Text style={tab === 'hourly' ? styles.tabTextActive : styles.tabText}>Hourly</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, tab === 'daily' && styles.tabActive]} onPress={() => setTab('daily')}>
                <Text style={tab === 'daily' ? styles.tabTextActive : styles.tabText}>Daily</Text>
              </TouchableOpacity>
            </View>

            {tab === 'hourly' ? (
              <FlatList
                horizontal
                data={hourly}
                keyExtractor={(item, index) => `${item.time}_${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
                renderItem={({ item }) => (
                  <View style={styles.hourlyCard}>
                    <Text style={styles.hourlyTime}>
                      {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.hourlyTemp}>{Math.round(item.temp_c)} C</Text>
                    <Text style={styles.hourlyMeta}>{item.condition}</Text>
                  </View>
                )}
              />
            ) : (
              <View style={styles.dailyContainer}>
                {daily.map((item, index) => (
                  <View key={`${item.date}_${index}`} style={styles.dailyRow}>
                    <Text style={styles.dailyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Text style={styles.dailyTemp}>
                      {Math.round(item.temp_max)} / {Math.round(item.temp_min)} C
                    </Text>
                    <Text style={styles.dailyTemp}>{item.precip} mm</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.savedCard}>
          <Text style={styles.savedTitle}>Saved Locations</Text>
          {savedLocations.length === 0 ? (
            <Text style={styles.savedEmpty}>No saved locations yet.</Text>
          ) : (
            savedLocations.map((item) => (
              <View key={item.id} style={styles.savedItem}>
                <TouchableOpacity onPress={() => fetchAll(item.lat, item.lon, item.city)} style={{ flex: 1 }}>
                  <Text style={styles.savedItemTitle}>
                    {item.city}, {item.country}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeSaved(item.id)}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    borderRadius: 18,
    backgroundColor: '#27483A',
    padding: 16,
    ...theme.shadow,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  subheading: {
    marginTop: 4,
    color: '#D5E7FD',
    fontWeight: '600',
  },
  searchRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5E5DB',
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: theme.colors.text,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#27483A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    ...theme.shadow,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8E4',
  },
  suggestionText: {
    color: theme.colors.text,
  },
  error: {
    marginTop: 8,
    color: theme.colors.danger,
    fontWeight: '700',
  },
  currentCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#fff',
    ...theme.shadow,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 18,
    color: '#27483A',
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
  },
  tempText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#27483A',
    marginTop: 8,
  },
  conditionText: {
    color: '#4A6070',
    fontWeight: '700',
    marginTop: 4,
  },
  metricsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    fontWeight: '700',
    color: '#27483A',
  },
  saveBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#27483A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  alertCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: '#F6DFA2',
  },
  alertHeadline: {
    fontWeight: '800',
    color: '#8B5E00',
    marginBottom: 4,
  },
  alertBody: {
    color: '#72511A',
    lineHeight: 18,
  },
  tabRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#EAF0EC',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#27483A',
  },
  tabText: {
    color: '#395667',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  hourlyCard: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    minWidth: 102,
    ...theme.shadow,
  },
  hourlyTime: {
    color: '#3A5668',
    fontWeight: '700',
  },
  hourlyTemp: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: '900',
    color: '#173D5E',
  },
  hourlyMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#647B89',
  },
  dailyContainer: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#fff',
    ...theme.shadow,
  },
  dailyRow: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4EBE6',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyDate: {
    flex: 1.3,
    color: '#27483A',
    fontWeight: '700',
  },
  dailyTemp: {
    flex: 1,
    color: '#345346',
    textAlign: 'right',
    fontWeight: '700',
  },
  savedCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 12,
    ...theme.shadow,
  },
  savedTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  savedEmpty: {
    color: '#66756D',
    marginTop: 6,
  },
  savedItem: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E7E1',
    paddingBottom: 8,
  },
  savedItemTitle: {
    color: '#2E4553',
    fontWeight: '700',
  },
});
