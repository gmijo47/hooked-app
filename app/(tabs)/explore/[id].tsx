import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, Modal, FlatList, Dimensions, Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import LocationMap from '@/components/LocationMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { Colors, Spacing, Radius, FontSize } from '@/constants/colors';
import {
  getDocument, getCollection, addDocument, updateDocument, deleteDocument,
  ViaFerrata, Review, Favorite,
  whereClause, orderByClause, limitClause,
} from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

const DIFFICULTY_COLORS: Record<string, string> = {
  'A': '#4CAF50', 'A/B': '#66BB6A', 'B': '#8BC34A',
  'B/C': '#FFC107', 'C': '#FF9800', 'C/D': '#FF5722',
  'D': '#F44336', 'E': '#D32F2F', 'E/F': '#B71C1C', 'F': '#880E4F',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  'A': 'Lako', 'A/B': 'Lako', 'B': 'Lako',
  'B/C': 'Srednje teško', 'C': 'Teško', 'C/D': 'Teško',
  'D': 'Vrlo teško', 'E': 'Ekstremno', 'E/F': 'Ekstremno', 'F': 'Ekstremno',
};

export default function FerrataDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [ferrata, setFerrata] = useState<(ViaFerrata & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [togglingFav, setTogglingFav] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<(Review & { id: string })[]>([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [targetExpanded, setTargetExpanded] = useState(false);
  const [accessExpanded, setAccessExpanded] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [reviewsVisible, setReviewsVisible] = useState(false);
  const previewScrollRef = useRef<ScrollView>(null);

  // Editing own review
  const [ownReviewId, setOwnReviewId] = useState<string | null>(null);
  const [ownReviewRating, setOwnReviewRating] = useState(0);
  const [ownReviewComment, setOwnReviewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // All images for preview: main + gallery
  const allImages = ferrata
    ? [ferrata.imageUrl, ...(ferrata.gallery || [])].filter(Boolean) as string[]
    : [];

  // ─── Load data ────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [fData, reviewsData] = await Promise.all([
        getDocument<ViaFerrata>('via_ferrata', id),
        getCollection<Review>('reviews', [
          whereClause('ferrataId', '==', id),
          orderByClause('createdAt', 'desc'),
        ]),
      ]);
      setFerrata(fData);
      setReviews(reviewsData);

      // Check if user already reviewed this ferrata
      if (user) {
        const ownReview = reviewsData.find((r: any) => r.userId === user.uid);
        if (ownReview) {
          setOwnReviewId(ownReview.id);
          setOwnReviewRating(ownReview.rating);
          setOwnReviewComment(ownReview.comment || '');
          setNewRating(ownReview.rating);
          setNewReview(ownReview.comment || '');
        } else {
          setOwnReviewId(null);
          setOwnReviewRating(0);
          setOwnReviewComment('');
          setNewRating(0);
          setNewReview('');
          setIsEditing(false);
        }
      }

      // Check if user has favorited
      if (user) {
        const favs = await getCollection<Favorite>('favorites', [
          whereClause('userId', '==', user.uid),
          whereClause('ferrataId', '==', id),
          limitClause(1),
        ]);
        if (favs.length > 0) {
          setIsFavorite(true);
          setFavId(favs[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load:', e);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  // ─── Favorite toggle ───────────────────────────────────────────────────

  const toggleFavorite = async () => {
    if (!user) {
      Alert.alert('Prijava', 'Za dodavanje favorita moraš biti prijavljen/a.');
      return;
    }
    setTogglingFav(true);
    try {
      if (isFavorite && favId) {
        await deleteDocument('favorites', favId);
        setIsFavorite(false);
        setFavId(null);
      } else {
        const newFavId = await addDocument('favorites', {
          userId: user.uid,
          ferrataId: id,
          ferrataName: ferrata?.name,
          createdAt: Timestamp.now(),
        });
        setIsFavorite(true);
        setFavId(newFavId);
      }
    } catch (e) {
      console.error('Favorite toggle error:', e);
    } finally {
      setTogglingFav(false);
    }
  };

  // ─── Submit / Update review ──────────────────────────────────────────────

  const submitReview = async () => {
    if (!user) {
      Alert.alert('Prijava', 'Za ostavljanje recenzije moras biti prijavljen/a.');
      return;
    }
    if (!newReview.trim() || newRating === 0) {
      Alert.alert('Greska', 'Odaberi ocjenu i napisi komentar.');
      return;
    }
    setSubmittingReview(true);
    try {
      if (ownReviewId) {
        // Update existing review
        await updateDocument('reviews', ownReviewId, {
          rating: newRating,
          comment: newReview.trim(),
          updatedAt: Timestamp.now(),
        } as any);
      } else {
        // Create new review
        const docId = await addDocument('reviews', {
          userId: user.uid,
          userName: user.email?.split('@')[0] ?? 'Nepoznato',
          ferrataId: id,
          rating: newRating,
          comment: newReview.trim(),
          createdAt: Timestamp.now(),
        });
        setOwnReviewId(docId);
      }
      setOwnReviewRating(newRating);
      setOwnReviewComment(newReview.trim());
      setIsEditing(false);
      // Reload reviews
      const reviewsData = await getCollection<Review>('reviews', [
        whereClause('ferrataId', '==', id),
        orderByClause('createdAt', 'desc'),
      ]);
      setReviews(reviewsData);
    } catch (e) {
      console.error('Review error:', e);
      Alert.alert('Greska', 'Nije moguce spremiti recenziju.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ─── Delete own review ────────────────────────────────────────────────────

  const deleteOwnReview = async () => {
    if (!ownReviewId) return;
    Alert.alert('Obrisi recenziju', 'Jesi siguran/na?', [
      { text: 'Odustani', style: 'cancel' },
      {
        text: 'Obrisi', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument('reviews', ownReviewId);
            setOwnReviewId(null);
            setOwnReviewRating(0);
            setOwnReviewComment('');
            setNewRating(0);
            setNewReview('');
            setIsEditing(false);
            const reviewsData = await getCollection<Review>('reviews', [
              whereClause('ferrataId', '==', id),
              orderByClause('createdAt', 'desc'),
            ]);
            setReviews(reviewsData);
          } catch (e) {
            console.error('Delete review error:', e);
          }
        },
      },
    ]);
  };

  // ─── Loading / Error states ────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  if (!ferrata) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.notFound}>Ferata nije pronađena.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diffColor = DIFFICULTY_COLORS[ferrata.difficulty] ?? Colors.textMuted;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}
    >
      {/* Standalone header (black, not overlaid) */}
      <View style={[styles.standaloneHeader, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnSmall} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.standaloneTitle} numberOfLines={1}>{ferrata.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main image */}
      {ferrata.imageUrl ? (
        <View style={styles.imageWrapper}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setPreviewIndex(0);
              setImagePreviewVisible(true);
            }}
          >
            <Image
              source={{ uri: ferrata.imageUrl }}
              style={styles.mainImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>

          {/* Favorite button at bottom-right of image */}
          <TouchableOpacity
            onPress={toggleFavorite}
            disabled={togglingFav}
            style={styles.favOnImage}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FF4444' : Colors.white}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.headerRow, { paddingTop: insets.top + Spacing.md }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{ferrata.name}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={[styles.hero, { backgroundColor: diffColor }]}>
            <Text style={styles.heroDiff}>{ferrata.difficulty}</Text>
            <Text style={styles.heroDiffLabel}>{ferrata.difficultyLabel || DIFFICULTY_LABELS[ferrata.difficulty]}</Text>
          </View>
        </>
      )}

      {/* Location */}
      <View style={styles.locationHero}>
        <MaterialCommunityIcons name="map-marker-outline" size={18} color={Colors.orange} />
        <Text style={styles.locationHeroText}>{ferrata.location}</Text>
      </View>

      {/* Top stats: only key ones with icons */}
      <View style={styles.statsGrid}>
        <StatBox icon="tape-measure" label="Dužina" value={`${ferrata.length} m`} />
        {ferrata.heightDiff && <StatBox icon="swap-vertical" label="Visina" value={ferrata.heightDiff} />}
        <StatBox icon="signal-cellular-3" label="Težina" value={ferrata.difficulty} />
      </View>

      {/* Extra info - full width card */}
      <View style={styles.extraInfoCard}>
        {ferrata.orientation && (
          <View style={styles.extraInfoRow}>
            <Text style={styles.extraInfoLabel}>Orijentacija</Text>
            <Text style={styles.extraInfoValue}>{ferrata.orientation}</Text>
          </View>
        )}
        {ferrata.climbingTime && (
          <View style={styles.extraInfoRow}>
            <Text style={styles.extraInfoLabel}>Vrijeme uspona</Text>
            <Text style={styles.extraInfoValue}>{ferrata.climbingTime}</Text>
          </View>
        )}
        {ferrata.descentTime && (
          <View style={styles.extraInfoRow}>
            <Text style={styles.extraInfoLabel}>Vrijeme spusta</Text>
            <Text style={styles.extraInfoValue}>{ferrata.descentTime}</Text>
          </View>
        )}
        {ferrata.accessTime && (
          <View style={styles.extraInfoRow}>
            <Text style={styles.extraInfoLabel}>Vrijeme pristupa</Text>
            <Text style={styles.extraInfoValue}>{ferrata.accessTime}</Text>
          </View>
        )}
        <View style={styles.extraInfoRow}>
          <Text style={styles.extraInfoLabel}>Ukupno trajanje</Text>
          <Text style={styles.extraInfoValue}>{ferrata.duration}</Text>
        </View>
      </View>

      {/* Gallery */}
      {ferrata.gallery && ferrata.gallery.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle icon="image-multiple-outline" title="Galerija" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryContent}
            decelerationRate="fast"
            snapToInterval={280}
            snapToAlignment="start"
          >
            {ferrata.gallery.map((url, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.9}
                onPress={() => {
                  setPreviewIndex(i + 1); // +1 because index 0 is main image
                  setImagePreviewVisible(true);
                }}
              >
                <Image source={{ uri: url }} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Description - expandable */}
      {ferrata.description ? (
        <View style={styles.section}>
          <SectionTitle icon="text-box-outline" title="Opis" />
          <ExpandableText text={ferrata.description} expanded={descExpanded} setExpanded={setDescExpanded} />
        </View>
      ) : null}

      {/* Target audience - expandable */}
      {ferrata.targetAudience ? (
        <View style={styles.section}>
          <SectionTitle icon="account-group-outline" title="Za koga je" />
          <ExpandableText text={ferrata.targetAudience} expanded={targetExpanded} setExpanded={setTargetExpanded} />
        </View>
      ) : null}

      {/* Access info - expandable */}
      {ferrata.accessInfo ? (
        <View style={styles.section}>
          <SectionTitle icon="sign-direction" title="Pristup" />
          <ExpandableText text={ferrata.accessInfo} expanded={accessExpanded} setExpanded={setAccessExpanded} />
        </View>
      ) : null}

      {/* Features card: badges + season together */}
      {(ferrata.fitnessLevel || ferrata.skillLevel || ferrata.experience || ferrata.landscape || (ferrata.bestSeason && ferrata.bestSeason.length > 0)) ? (
        <View style={styles.section}>
          <View style={styles.featuresCard}>
            {/* Ratings */}
            {(ferrata.fitnessLevel || ferrata.skillLevel || ferrata.experience || ferrata.landscape) ? (
              <View style={styles.featuresBlock}>
                <SectionTitle icon="chart-bar" title="Ocjene" />
                <View style={styles.badgeRow}>
                  {ferrata.fitnessLevel ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeLabel}>Kondicija</Text>
                      <Text style={styles.badgeValue}>{ferrata.fitnessLevel}</Text>
                    </View>
                  ) : null}
                  {ferrata.skillLevel ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeLabel}>Vještine</Text>
                      <Text style={styles.badgeValue}>{ferrata.skillLevel}</Text>
                    </View>
                  ) : null}
                  {ferrata.experience ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeLabel}>Iskustvo</Text>
                      <Text style={styles.badgeValue}>{ferrata.experience}</Text>
                    </View>
                  ) : null}
                  {ferrata.landscape ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeLabel}>Pejzaž</Text>
                      <Text style={styles.badgeValue}>{ferrata.landscape}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Best season */}
            {ferrata.bestSeason && ferrata.bestSeason.length > 0 ? (
              <View style={styles.featuresBlock}>
                <SectionTitle icon="calendar-month" title="Najbolje doba godine" />
                <View style={styles.seasonRow}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'].map((m) => {
                    const active = ferrata.bestSeason!.includes(m);
                    return (
                      <View key={m} style={[styles.seasonMonth, active && styles.seasonMonthActive]}>
                        <Text style={[styles.seasonMonthText, active && styles.seasonMonthTextActive]}>{m}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Location - embedded map */}
      {ferrata.latitude && ferrata.longitude ? (
        <View style={styles.section}>
          <SectionTitle icon="earth" title="Lokacija" />
          <LocationMap
            latitude={ferrata.latitude}
            longitude={ferrata.longitude}
            name={ferrata.name}
          />
        </View>
      ) : null}

      {/* ─── Reviews section ──────────────────────────────────────────────── */}
      <View style={[styles.section, { marginTop: Spacing.md }]}>
        <View style={styles.reviewsHeader}>
          <View>
            <SectionTitle icon="star-outline" title="Recenzije" />
            {/* Rating next to reviews title */}
            {ferrata.rating != null && ferrata.rating > 0 && (
              <View style={styles.ratingHero}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= Math.round(ferrata.rating) ? 'star' : 'star-outline'}
                    size={16}
                    color="#FFD700"
                  />
                ))}
                <Text style={styles.ratingHeroText}>{ferrata.rating.toFixed(1)}</Text>
                {ferrata.reviewCount != null && (
                  <Text style={styles.ratingHeroCount}>({ferrata.reviewCount})</Text>
                )}
              </View>
            )}
          </View>
          {reviews.length > 0 && (
            <TouchableOpacity
              style={styles.reviewsSeeAllBtn}
              onPress={() => setReviewsVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.reviewsSeeAllText}>Prikaži sve</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.orange} />
            </TouchableOpacity>
          )}
        </View>

        {/* First 2 reviews preview */}
        {reviews.slice(0, 2).map((r) => (
          <View key={r.id} style={styles.reviewItemCard}>
            <View style={styles.reviewItemTop}>
              <View style={styles.reviewAvatar}>
                <MaterialCommunityIcons name="account-circle-outline" size={36} color={Colors.textSecondary} />
              </View>
              <View style={styles.reviewItemContent}>
                <View style={styles.reviewItemNameRow}>
                  <Text style={styles.reviewAuthor}>{r.userName || 'Nepoznato'}</Text>
                  <Text style={styles.reviewDate}>
                    {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('bs-BA', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </Text>
                </View>
                <View style={styles.reviewStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <MaterialCommunityIcons
                      key={s}
                      name={s <= r.rating ? 'star' : 'star-outline'}
                      size={14}
                      color={s <= r.rating ? '#FFD700' : Colors.textMuted}
                    />
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.reviewCommentText} numberOfLines={3}>{r.comment}</Text>
          </View>
        ))}

        {reviews.length === 0 && (
          <Text style={styles.noReviews}>Još nema recenzija. Budi prvi/a!</Text>
        )}

        {/* Add review button */}
        <TouchableOpacity
          style={styles.addReviewBtn}
          onPress={() => {
            if (!user) {
              Alert.alert('Prijava', 'Za ostavljanje recenzije moraš biti prijavljen/a.');
              return;
            }
            setReviewsVisible(true);
          }}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="star-plus-outline" size={18} color={Colors.orange} />
          <Text style={styles.addReviewText}>Napiši recenziju</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Reviews modal ──────────────────────────────────────────── */}
      <Modal
        visible={reviewsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewsVisible(false)}
      >
        <TouchableOpacity
          style={styles.reviewsModalOverlay}
          activeOpacity={1}
          onPress={() => setReviewsVisible(false)}
        >
          <View />
        </TouchableOpacity>
        <View style={styles.reviewsModal}>
          <View style={styles.reviewsModalHeader}>
            <TouchableOpacity onPress={() => setReviewsVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.reviewsModalTitle}>Recenzije</Text>
            <View style={{ width: 24 }} />
          </View>
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.reviewsModalList}
            ListHeaderComponent={
              <>
                {/* Review form — create new (only if no own review) */}
                {user && !ownReviewId ? (
                  <View style={styles.reviewFormCard}>
                    <Text style={styles.reviewFormCardTitle}>Nova recenzija</Text>
                    <View style={styles.starsBigRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setNewRating(s === newRating ? 0 : s)}>
                          <MaterialCommunityIcons
                            name={s <= newRating ? 'star' : 'star-outline'}
                            size={32}
                            color={s <= newRating ? '#FFD700' : Colors.textMuted}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.reviewInput}
                      value={newReview}
                      onChangeText={setNewReview}
                      placeholder="Napisi recenziju..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[styles.reviewSubmitBtn, submittingReview && { opacity: 0.5 }]}
                      onPress={submitReview}
                      disabled={submittingReview}
                      activeOpacity={0.85}
                    >
                      {submittingReview
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Text style={styles.reviewSubmitText}>Objavi</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Own review — editing mode */}
                {user && ownReviewId && isEditing ? (
                  <View style={styles.reviewFormCard}>
                    <View style={styles.reviewFormCardHeader}>
                      <Text style={styles.reviewFormCardTitle}>Uredi recenziju</Text>
                      <TouchableOpacity onPress={() => setIsEditing(false)}>
                        <MaterialCommunityIcons name="close-circle-outline" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.starsBigRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <TouchableOpacity key={s} onPress={() => setNewRating(s === newRating ? 0 : s)}>
                          <MaterialCommunityIcons
                            name={s <= newRating ? 'star' : 'star-outline'}
                            size={32}
                            color={s <= newRating ? '#FFD700' : Colors.textMuted}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.reviewInput}
                      value={newReview}
                      onChangeText={setNewReview}
                      placeholder="Napisi recenziju..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[styles.reviewSubmitBtn, submittingReview && { opacity: 0.5 }]}
                      onPress={submitReview}
                      disabled={submittingReview}
                      activeOpacity={0.85}
                    >
                      {submittingReview
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Text style={styles.reviewSubmitText}>Spremi izmjene</Text>
                      }
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            }
            ListEmptyComponent={
              <Text style={styles.noReviews}>Još nema recenzija. Budi prvi/a!</Text>
            }
            renderItem={({ item: r }) => {
                const isOwn = user && r.userId === user.uid;
                return (
                  <View style={styles.reviewItemCard}>
                    {/* Skip own review in list if editing — show only the edit form */}
                    {isOwn && isEditing ? null : (
                      <>
                        <View style={styles.reviewItemTop}>
                          <View style={styles.reviewAvatar}>
                            <MaterialCommunityIcons
                              name={isOwn ? 'account-circle' : 'account-circle-outline'}
                              size={36}
                              color={isOwn ? Colors.orange : Colors.textSecondary}
                            />
                          </View>
                          <View style={styles.reviewItemContent}>
                            <View style={styles.reviewItemNameRow}>
                              <Text style={styles.reviewAuthor}>
                                {r.userName || 'Nepoznato'}
                                {isOwn && <Text style={styles.reviewYouTag}> (ti)</Text>}
                              </Text>
                              <Text style={styles.reviewDate}>
                                {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('bs-BA', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                              </Text>
                            </View>
                            <View style={styles.reviewStarsRow}>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <MaterialCommunityIcons
                                  key={s}
                                  name={s <= r.rating ? 'star' : 'star-outline'}
                                  size={14}
                                  color={s <= r.rating ? '#FFD700' : Colors.textMuted}
                                />
                              ))}
                            </View>
                          </View>
                          {/* Edit/delete buttons for own review */}
                          {isOwn && !isEditing ? (
                            <View style={styles.ownBtns}>
                              <TouchableOpacity
                                onPress={() => {
                                  setNewRating(r.rating);
                                  setNewReview(r.comment || '');
                                  setIsEditing(true);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.orange} />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={deleteOwnReview} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <MaterialCommunityIcons name="delete-outline" size={18} color="#F44336" />
                              </TouchableOpacity>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.reviewCommentText}>{r.comment}</Text>
                      </>
                    )}
                  </View>
                );
              }}
          />
        </View>
      </Modal>

      {/* ─── Image preview modal ─────────────────────────────────────────── */}
      <Modal
        visible={imagePreviewVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setImagePreviewVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>

          {allImages.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.imagePreviewScroll}
            >
              {allImages.map((url, i) => (
                <View key={i} style={styles.imagePreviewPage}>
                  <RNImage
                    source={{ uri: url || '' }}
                    style={styles.imagePreviewImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePreviewContent}>
              <RNImage
                source={{ uri: allImages[0] || ferrata?.imageUrl || '' }}
                style={styles.imagePreviewImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatBox({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <MaterialCommunityIcons name={icon} size={24} color={Colors.orange} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <MaterialCommunityIcons name={icon} size={18} color={Colors.orange} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ExpandableText({ text, expanded, setExpanded }: { text: string; expanded: boolean; setExpanded: (v: boolean) => void }) {
  return (
    <>
      <Text style={styles.description} numberOfLines={expanded ? undefined : 5}>
        {text}
      </Text>
      {text.length > 200 && (
        <TouchableOpacity
          style={styles.readMoreBtn}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.readMoreText}>
            {expanded ? 'Prikaži manje' : 'Pročitaj više'}
          </Text>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.orange}
          />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  container: {},
  center: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  notFound: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  backBtn: { padding: Spacing.sm },
  backBtnText: { color: Colors.orange, fontSize: FontSize.md, fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  backArrow: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    width: 44,
  },
  imageWrapper: {
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: 360,
  },
  standaloneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtnSmall: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  standaloneTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginLeft: Spacing.xs,
  },
  favOnImage: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreviewScroll: {
    flex: 1,
    width: '100%',
  },
  imagePreviewPage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  hero: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  heroDiff: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
  },
  heroDiffLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 32,
  },
  locationHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  locationHeroText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ratingHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  ratingHeroText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 4,
  },
  ratingHeroCount: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  extraInfoCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  extraInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extraInfoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  extraInfoValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: 6,
    minWidth: 70,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 24,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  readMoreText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.orange,
  },
  // Reviews
  reviewCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewsSeeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  reviewsSeeAllText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.orange,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: 12,
  },
  addReviewText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.orange,
  },
  // Review form card
  reviewFormCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reviewFormCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewFormCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  starsBigRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewInput: {
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.sm,
    minHeight: 80,
  },
  reviewSubmitBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewSubmitText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  // Review item card
  reviewItemCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reviewItemOwn: {
    borderColor: Colors.orange,
    borderWidth: 1.5,
  },
  reviewItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewItemContent: {
    flex: 1,
    gap: 2,
  },
  reviewItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewYouTag: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.orange,
    fontStyle: 'italic',
  },
  reviewDate: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  reviewCommentText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  ownBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  noReviews: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  // Reviews modal
  reviewsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  reviewsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  reviewsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  reviewsModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewsModalList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  // Skills / season styles (from previous update)
  featuresBlock: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  // Gallery
  galleryScroll: {
    marginTop: Spacing.sm,
  },
  galleryContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  galleryImage: {
    width: 260,
    height: 170,
    borderRadius: Radius.lg,
    resizeMode: 'cover',
  },
  // Features card
  featuresCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  // Skill badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  badgeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  // Season months
  seasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  seasonMonth: {
    width: 40,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonMonthActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  seasonMonthText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  seasonMonthTextActive: {
    color: Colors.white,
  },
});
