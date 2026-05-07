import asyncio
import aiohttp
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime, timedelta

def ms_to_kmh(speed_ms):
    return round(speed_ms * 3.6, 1)


def weather_key_configured():
    return bool(settings.OPENWEATHER_API_KEY)


def mock_forecast_payload():
    now = datetime.utcnow()
    hourly = []
    for i in range(24):
        ts = now + timedelta(hours=i)
        hourly.append(
            {
                'time': ts.strftime('%Y-%m-%d %H:%M:%S'),
                'temp_c': round(18 + (i % 5), 1),
                'humidity': 60 + (i % 25),
                'wind_speed': 8 + (i % 7),
                'condition': 'clear sky' if i % 3 else 'few clouds',
            }
        )

    daily = []
    for i in range(5):
        day = now.date() + timedelta(days=i)
        daily.append(
            {
                'date': str(day),
                'temp_min': 14 + i,
                'temp_max': 24 + i,
                'precip': round((i % 3) * 1.2, 1),
                'condition': 'partly cloudy',
            }
        )

    return {'hourly': hourly, 'daily': daily}

@api_view(['GET'])
def geocode(request):
    query = request.GET.get('q', '')
    if not query:
        return Response({'error': 'Missing q parameter'}, status=400)

    if not weather_key_configured():
        return Response(
            [
                {
                    'name': query.title(),
                    'country': 'ZA',
                    'state': '',
                    'lat': -29.8587,
                    'lon': 31.0218,
                }
            ],
            headers={'Cache-Control': 'no-cache'},
        )

    url = (
        f"https://api.openweathermap.org/geo/1.0/direct"
        f"?q={query}&limit=10&appid={settings.OPENWEATHER_API_KEY}"
    )

    async def fetch():
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return None
                return await resp.json()

    data = asyncio.run(fetch())
    if data is None:
        return Response({'error': 'Geocoding failed'}, status=502)

    results = [{
        'name': item['name'],
        'country': item.get('country', ''),
        'state': item.get('state'),
        'lat': item['lat'],
        'lon': item['lon']
    } for item in data]

    return Response(results, headers={'Cache-Control': 'no-cache'})

@api_view(['GET'])
def reverse_geocode(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    if not lat or not lon:
        return Response({'error': 'Missing lat/lon'}, status=400)

    if not weather_key_configured():
        return Response({'name': 'Current Location', 'country': 'ZA', 'state': ''})

    url = (
        f"https://api.openweathermap.org/geo/1.0/reverse"
        f"?lat={lat}&lon={lon}&limit=1&appid={settings.OPENWEATHER_API_KEY}"
    )

    async def fetch():
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return None
                return await resp.json()

    data = asyncio.run(fetch())
    if not data:
        return Response({'name': 'Unknown', 'country': ''})

    return Response({
        'name': data[0].get('name', 'Unknown'),
        'country': data[0].get('country', ''),
        'state': data[0].get('state', ''),
    })


@api_view(['GET'])
def current_weather(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    if not lat or not lon:
        return Response({'error': 'Missing lat/lon'}, status=400)

    if not weather_key_configured():
        return Response(
            {
                'city': 'Local Weather',
                'country': 'ZA',
                'temp_c': 22.0,
                'humidity': 64,
                'wind_speed': 11.0,
                'condition': 'partly cloudy',
                'icon': '02d',
                'lat': float(lat),
                'lon': float(lon),
            },
            headers={'Cache-Control': 'no-cache'},
        )

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&units=metric&appid={settings.OPENWEATHER_API_KEY}"
    )

    async def fetch():
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return None
                return await resp.json()

    data = asyncio.run(fetch())
    if data is None:
        return Response({'error': 'Weather data not found'}, status=502)

    result = {
        'city': data.get('name', 'Unknown'),
        'country': data.get('sys', {}).get('country', ''),
        'temp_c': round(data['main']['temp'], 1),
        'humidity': data['main']['humidity'],
        'wind_speed': ms_to_kmh(data['wind']['speed']),
        'condition': data['weather'][0]['description'],
        'icon': data['weather'][0]['icon'],
        'lat': float(lat),
        'lon': float(lon),
    }
    return Response(result, headers={'Cache-Control': 'no-cache'})


@api_view(['GET'])
def forecast(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    if not lat or not lon:
        return Response({'error': 'Missing lat/lon'}, status=400)

    if not weather_key_configured():
        return Response(mock_forecast_payload(), headers={'Cache-Control': 'no-cache'})

    url = (
        f"https://api.openweathermap.org/data/2.5/forecast"
        f"?lat={lat}&lon={lon}&units=metric&appid={settings.OPENWEATHER_API_KEY}"
    )

    async def fetch():
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    return None
                return await resp.json()

    data = asyncio.run(fetch())
    if data is None:
        return Response({'error': 'Forecast not found'}, status=502)

    hourly = []
    daily_map = {}

    for item in data['list']:
        dt = item['dt_txt']
        hourly.append({
            'time': dt,
            'temp_c': round(item['main']['temp'], 1),
            'humidity': item['main']['humidity'],
            'wind_speed': ms_to_kmh(item['wind']['speed']),
            'condition': item['weather'][0]['description']
        })

        date = dt.split()[0]
        rain_mm = 0
        if 'rain' in item and '3h' in item['rain']:
            rain_mm = item['rain']['3h']
        elif 'snow' in item and '3h' in item['snow']:
            rain_mm = item['snow']['3h']

        if date not in daily_map:
            daily_map[date] = {
                'date': date,
                'temp_min': item['main']['temp_min'],
                'temp_max': item['main']['temp_max'],
                'precip': rain_mm,
                'condition': item['weather'][0]['description']
            }
        else:
            daily_map[date]['temp_min'] = min(daily_map[date]['temp_min'], item['main']['temp_min'])
            daily_map[date]['temp_max'] = max(daily_map[date]['temp_max'], item['main']['temp_max'])
            daily_map[date]['precip'] += rain_mm
            daily_map[date]['condition'] = item['weather'][0]['description']

    daily = []
    for date in sorted(daily_map.keys())[:5]:
        d = daily_map[date]
        daily.append({
            'date': date,
            'temp_min': round(d['temp_min'], 1),
            'temp_max': round(d['temp_max'], 1),
            'precip': round(d['precip'], 1),
            'condition': d['condition']
        })

    return Response({
        'hourly': hourly[:24],
        'daily': daily
    }, headers={'Cache-Control': 'no-cache'})


@api_view(['GET'])
def alerts(request):
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')
    if not lat or not lon:
        return Response({'headline': 'No active alerts', 'description': 'Location missing', 'category': 'info'})

    if not weather_key_configured():
        return Response(
            {
                'headline': 'No active alerts',
                'description': 'API key not configured. Showing baseline weather mode.',
                'category': 'info',
            }
        )

    url = (
        f"https://api.openweathermap.org/data/3.0/onecall"
        f"?lat={lat}&lon={lon}&exclude=current,minutely,hourly,daily"
        f"&appid={settings.OPENWEATHER_API_KEY}"
    )

    async def fetch():
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status != 200:
                    return None
                return await resp.json()

    try:
        data = asyncio.run(fetch())
        if data is None:
            return Response({'headline': 'No active alerts', 'description': 'Conditions are calm.', 'category': 'good'})

        alerts_list = data.get('alerts', [])
        if not alerts_list:
            return Response({'headline': 'No active alerts', 'description': 'Conditions are calm.', 'category': 'good'})

        alert = alerts_list[0]
        event = alert.get('event', '').lower()
        desc = alert.get('description', '')

        # Classify for farmers
        if 'rain' in event or 'flood' in event or 'precip' in event:
            category = 'rain'
            icon = '🌧️'
        elif 'wind' in event or 'storm' in event:
            category = 'wind'
            icon = '💨'
        elif 'frost' in event or 'freeze' in event or 'cold' in event:
            category = 'frost'
            icon = '❄️'
        elif 'heat' in event or 'drought' in event:
            category = 'heat'
            icon = '🔥'
        else:
            category = 'general'
            icon = '⚠️'

        headline = f"{icon} {alert.get('event', 'Weather Alert')}"
        # Add farmer advice
        advice = ''
        if category == 'rain':
            advice = ' Avoid field work. Check drainage systems.'
        elif category == 'wind':
            advice = ' Secure greenhouses and livestock shelters.'
        elif category == 'frost':
            advice = ' Cover sensitive crops. Delay planting.'
        elif category == 'heat':
            advice = ' Irrigate early morning. Provide shade for animals.'
        else:
            advice = ' Monitor conditions and take necessary precautions.'

        description = desc + advice

        return Response({
            'headline': headline,
            'description': description,
            'category': category
        })

    except Exception:
        return Response({'headline': 'No active alerts', 'description': 'Alert service unavailable.', 'category': 'error'})
