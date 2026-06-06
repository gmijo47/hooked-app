import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';

const API_KEY = 'AIzaSyAjTFmxkqP-ej7_JJMlSaEyJ9tNsFZfyvg';

type Props = {
  latitude: number;
  longitude: number;
  name: string;
};

export default function LocationMap({ latitude, longitude, name }: Props) {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%}#map{width:100%;height:100%}</style>
</head><body><div id="map"></div><script>
function init(){
var p={lat:${latitude},lng:${longitude}};
var map=new google.maps.Map(document.getElementById('map'),{
center:p,zoom:14,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,
styles:[{elementType:"geometry",stylers:[{color:"#242f3e"}]},{elementType:"labels.text.fill",stylers:[{color:"#746855"}]},{elementType:"labels.text.stroke",stylers:[{color:"#242f3e"}]},{featureType:"road",elementType:"geometry",stylers:[{color:"#38414e"}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#17263c"}]}]});
new google.maps.Marker({position:p,map:map,title:${JSON.stringify(name)}});
}
var s=document.createElement('script');
s.src='https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=init';
s.async=true;document.head.appendChild(s);
</script></body></html>`;

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        source={{ html }}
        scrollEnabled={false}
        javaScriptEnabled
      />
      <TouchableOpacity
        style={styles.openBtn}
        onPress={() => Linking.openURL(url)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="google-maps" size={18} color={Colors.orange} />
        <Text style={styles.openText}>Otvori u Google Maps</Text>
        <MaterialCommunityIcons name="open-in-new" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  map: {
    width: '100%',
    height: 200,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
  },
  openText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.orange,
  },
});
