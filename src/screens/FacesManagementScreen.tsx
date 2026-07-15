import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Trash2, UserCircle, Camera, RefreshCw } from 'lucide-react-native';
import { theme } from '../theme';
import { FaceEntry } from '../types';
import { getFaces, deleteFace, getFaceImageUrl } from '../api/faces';
import { getBaseUrl, getApiToken } from '../api/client';

// ═══════════════════════════════════════════════════════════════
// FacesManagementScreen — Section 4 DocsGateway
// Gestion complète des visages enregistrés
// ═══════════════════════════════════════════════════════════════

export default function FacesManagementScreen({ navigation }: any) {
  const [faces, setFaces] = useState<FaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [apiToken, setApiToken] = useState('');

  const fetchFaces = async () => {
    setLoading(true);
    try {
      const data = await getFaces();
      setFaces(data);
    } catch (e) {
      console.error('Error fetching faces', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseUrl = async () => {
    const url = await getBaseUrl();
    setBaseUrl(url);
    const token = await getApiToken();
    setApiToken(token || '');
  };

  useEffect(() => {
    if (!baseUrl || faces.length === 0) return;
    const loadUris = async () => {
      const uris: Record<string, string> = {};
      for (const face of faces) {
        uris[face.face_id] = await getFaceImageUrl(face.face_id, baseUrl);
      }
      setImageUris(uris);
    };
    loadUris();
  }, [baseUrl, faces]);

  useEffect(() => {
    fetchFaces();
    fetchBaseUrl();
  }, []);

  const handleDelete = (face: FaceEntry) => {
    Alert.alert(
      'Supprimer le visage',
      `Êtes-vous sûr de vouloir supprimer « ${face.name} » ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(face.face_id);
            try {
              await deleteFace(face.face_id);
              setFaces(prev => prev.filter(f => f.face_id !== face.face_id));
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de supprimer ce visage.');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  const getImageUri = (faceId: string): string => imageUris[faceId] || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>V I S A G E S</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchFaces}>
          <RefreshCw color={theme.colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Camera color={theme.colors.secondary} size={20} />
          <Text style={styles.infoBannerText}>
            Maximum 8 photos par personne. Ajoutez des photos depuis votre Profil Conducteur.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.loadingText}>Chargement des visages...</Text>
          </View>
        ) : faces.length === 0 ? (
          <View style={styles.centerState}>
            <UserCircle color={theme.colors.textMuted} size={80} strokeWidth={0.8} />
            <Text style={styles.emptyTitle}>Aucun visage enregistré</Text>
            <Text style={styles.emptySubtitle}>
              Allez dans votre Profil Conducteur pour ajouter des photos.
            </Text>
            <TouchableOpacity 
              style={styles.goProfileBtn} 
              onPress={() => navigation.navigate('DriverProfile')}
              activeOpacity={0.7}
            >
              <Text style={styles.goProfileBtnText}>ALLER AU PROFIL</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.facesList}>
            <Text style={styles.sectionTitle}>
              {faces.length} VISAGE{faces.length > 1 ? 'S' : ''} ENREGISTRÉ{faces.length > 1 ? 'S' : ''}
            </Text>
            {faces.map((face, index) => (
              <Animated.View 
                key={face.face_id} 
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={styles.faceCard}
              >
                <View style={styles.faceLeft}>
                  {baseUrl ? (
                    <Image
                      source={{
                        uri: getImageUri(face.face_id),
                        headers: apiToken ? { 'X-API-Token': apiToken } : undefined,
                      }}
                      style={styles.faceImage}
                      defaultSource={require('../../assets/icon.png')}
                    />
                  ) : (
                    <View style={[styles.faceImage, styles.facePlaceholder]}>
                      <UserCircle color={theme.colors.textMuted} size={32} />
                    </View>
                  )}
                  <View style={{ marginLeft: 16 }}>
                    <Text style={styles.faceName}>{face.name}</Text>
                    {face.image_count !== undefined && (
                      <Text style={styles.faceCount}>{face.image_count} photo{face.image_count > 1 ? 's' : ''}</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(face)}
                  disabled={deleting === face.face_id}
                  activeOpacity={0.6}
                >
                  {deleting === face.face_id ? (
                    <ActivityIndicator color={theme.colors.danger} size="small" />
                  ) : (
                    <Trash2 color={theme.colors.danger} size={20} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  backButton: { padding: theme.spacing.xs },
  title: {
    ...theme.typography.h3,
    letterSpacing: 2,
  },
  refreshBtn: {
    padding: theme.spacing.s,
    backgroundColor: 'rgba(213, 0, 28, 0.1)',
    borderRadius: theme.borderRadius.round,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.xxl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  infoBannerText: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    flex: 1,
    marginLeft: theme.spacing.m,
    lineHeight: 20,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  loadingText: {
    ...theme.typography.caption,
    marginTop: theme.spacing.m,
  },
  emptyTitle: {
    ...theme.typography.h3,
    marginTop: theme.spacing.l,
    color: theme.colors.textMuted,
  },
  emptySubtitle: {
    ...theme.typography.caption,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 22,
  },
  goProfileBtn: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.text,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.s,
  },
  goProfileBtnText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.background,
    letterSpacing: 2,
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.m,
    letterSpacing: 2,
  },
  facesList: {
    marginTop: theme.spacing.s,
  },
  faceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  faceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faceImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceLight,
  },
  facePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceName: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  faceCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: theme.spacing.m,
    backgroundColor: 'rgba(213, 0, 28, 0.1)',
    borderRadius: theme.borderRadius.round,
  },
});
