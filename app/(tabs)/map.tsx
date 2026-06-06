import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import { getCollection, ViaFerrata } from '@/lib/firestore';

const API_KEY = 'AIzaSyAjTFmxkqP-ej7_JJMlSaEyJ9tNsFZfyvg';
const BH_CENTER = { lat: 43.9159, lng: 17.6791 };
const DEFAULT_ZOOM = 8;

function getMarkerColor(difficulty: string): string {
  const c: Record<string, string> = {
    'A': '#4CAF50', 'A/B': '#66BB6A', 'B': '#8BC34A',
    'B/C': '#FFC107', 'C': '#FF9800', 'C/D': '#FF5722',
    'D': '#F44336', 'E': '#D32F2F', 'E/F': '#B71C1C', 'F': '#880E4F',
  };
  for (const [k, v] of Object.entries(c)) {
    if (difficulty.includes(k)) return v;
  }
  return '#FF6B1A';
}

function buildMapHtml(ferrate: (ViaFerrata & { id: string })[]): string {
  const markersJs = ferrate.map((f) => {
    const color = getMarkerColor(f.difficulty || 'B');
    return `{
      id:"${f.id}",lat:${f.latitude},lng:${f.longitude},
      name:${JSON.stringify(f.name)},location:${JSON.stringify(f.location)},
      difficulty:${JSON.stringify(f.difficulty)},color:"${color}",
      length:${JSON.stringify(f.length ? f.length+'m' : '')},
      duration:${JSON.stringify(f.duration || '')}
    }`;
  }).join(',\n');

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100vh}</style>
</head><body><div id="map"></div><script>
const M=[${markersJs}];
function init(){
const map=new google.maps.Map(document.getElementById('map'),{
center:{lat:${BH_CENTER.lat},lng:${BH_CENTER.lng}},zoom:${DEFAULT_ZOOM},
mapTypeControl:false,streetViewControl:false,fullscreenControl:false,
styles:[{elementType:"geometry",stylers:[{color:"#242f3e"}]},{elementType:"labels.text.fill",stylers:[{color:"#746855"}]},{elementType:"labels.text.stroke",stylers:[{color:"#242f3e"}]},{featureType:"administrative.locality",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"poi.park",elementType:"geometry",stylers:[{color:"#263c3f"}]},{featureType:"poi.park",elementType:"labels.text.fill",stylers:[{color:"#6b9a76"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#38414e"}]},{featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#212a37"}]},{featureType:"road",elementType:"labels.text.fill",stylers:[{color:"#9ca5b3"}]},{featureType:"road.highway",elementType:"geometry",stylers:[{color:"#746855"}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{color:"#1f2835"}]},{featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#f3d19c"}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#2f3948"}]},{featureType:"transit.station",elementType:"labels.text.fill",stylers:[{color:"#d59563"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#17263c"}]},{featureType:"water",elementType:"labels.text.fill",stylers:[{color:"#515c6d"}]},{featureType:"water",elementType:"labels.text.stroke",stylers:[{color:"#17263c"}]}]});
const b=new google.maps.LatLngBounds();
const iw=new google.maps.InfoWindow({maxWidth:250});
M.forEach(function(m){
var p={lat:m.lat,lng:m.lng};b.extend(p);
var mk=new google.maps.Marker({position:p,map:map,title:m.name,
icon:{path:'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',fillColor:m.color,fillOpacity:1,strokeColor:'#fff',strokeWeight:1.5,scale:2,anchor:new google.maps.Point(12,22)}});
mk.addListener('click',function(){
var c='<div style="font-family:sans-serif;padding:8px 2px;max-width:240px">'+
'<div style="font-weight:700;font-size:14px;color:#1a1a2e;margin-bottom:4px">'+m.name+'</div>'+
'<div style="font-size:12px;color:#666;margin-bottom:6px">📍 '+m.location+'</div>'+
'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+
'<span style="background:'+m.color+';color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px">'+m.difficulty+'</span>'+
(m.length?'<span style="border:1px solid #ddd;color:#666;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px">'+m.length+'</span>':'')+
(m.duration?'<span style="border:1px solid #ddd;color:#666;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px">'+m.duration+'</span>':'')+
'</div><a href="#" onclick="window.ReactNativeWebView.postMessage(\\'ferrata:'+m.id+'\\');return false" style="display:block;text-align:center;background:#FF6B1A;color:#fff;font-size:12px;font-weight:700;padding:8px;border-radius:6px;text-decoration:none">Detalji →</a></div>';
iw.setContent(c);iw.open(map,mk);});});
if(M.length>1){map.fitBounds(b,{top:60,right:40,bottom:40,left:40});}
else if(M.length===1){map.setCenter({lat:M[0].lat,lng:M[0].lng});map.setZoom(13);}
window.fitAll=function(){if(M.length>0)map.fitBounds(b,{top:60,right:40,bottom:40,left:40});};}
var s=document.createElement('script');
s.src='https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init';
s.async=true;document.head.appendChild(s);
</script></body></html>`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const webRef = useRef<any>(null);

  const [ferrate, setFerrate] = useState<(ViaFerrata & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFerrate(); }, []);

  const loadFerrate = async () => {
    try {
      const data = await getCollection<ViaFerrata>('via_ferrata');
      const withCoords = data.filter((f: any) => f.latitude && f.longitude);
      setFerrate(withCoords as (ViaFerrata & { id: string })[]);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fitAll = useCallback(() => {
    webRef.current?.injectJavaScript('fitAll();true;');
  }, []);

  const html = ferrate.length > 0 ? buildMapHtml(ferrate) : '';

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={styles.loadingText}>Učitavanje ferata...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {html ? (
        <WebView
          ref={webRef}
          style={styles.map}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled={false}
          onMessage={(event) => {
            const msg = event.nativeEvent.data;
            if (msg.startsWith('ferrata:')) {
              const id = msg.split(':')[1];
              if (id) router.push(`/(tabs)/explore/${id}` as any);
            }
          }}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Nema ferata sa koordinatama</Text>
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.headerTitle}>Mapa ferata</Text>
        <Text style={styles.headerSub}>{ferrate.length} lokacija</Text>
      </View>

      <TouchableOpacity style={styles.fitBtn} onPress={fitAll} activeOpacity={0.7}>
        <MaterialCommunityIcons name="fit-to-screen-outline" size={22} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  map: { flex: 1 },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(12,13,18,0.85)',
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  fitBtn: {
    position: 'absolute', bottom: 100, right: Spacing.lg,
    width: 46, height: 46, borderRadius: Radius.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
});

