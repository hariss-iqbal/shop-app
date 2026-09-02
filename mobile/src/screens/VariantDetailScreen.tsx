import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  getVariantDetail,
  updateVariantPrice,
  updateVariantFields,
  toggleVariantActive,
  setVariantColorActive,
  moveVariantColor,
  uploadVariantImage,
  setPrimaryImage,
  deleteVariantImage,
  addStock,
  VariantDetail,
  VariantImage,
} from '../api/variants';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'open_box', label: 'Open Box' },
  { value: 'used', label: 'Used' },
];
const PTA_OPTIONS = [
  { value: 'pta_approved', label: 'PTA Approved' },
  { value: 'non_pta', label: 'Non-PTA' },
  { value: '', label: 'None' },
];
import { colors, formatPkr, conditionLabel, ptaLabel } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'VariantDetail'>;

// Lightweight cross-platform confirm (Alert isn't wired on web).
function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function VariantDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation();
  const { id } = route.params;

  const [variant, setVariant] = useState<VariantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Price editing
  const [priceInput, setPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);

  const [togglingActive, setTogglingActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Which color the next uploaded image is for (null = generic / all colors).
  // Which color the images section is managing (upload target + strip filter).
  // Defaults to the variant's first color so uploads are color-tagged, not generic.
  const [uploadColor, setUploadColor] = useState<string | null>(null);
  const colorInit = useRef(false);
  useEffect(() => {
    if (variant && !colorInit.current && variant.availableColors.length > 0) {
      setUploadColor(variant.availableColors[0]);
      colorInit.current = true;
    }
  }, [variant]);

  // Details editing (storage / condition / PTA / colors)
  const [storageInput, setStorageInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [ptaInput, setPtaInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Add-stock form
  const [stockColor, setStockColor] = useState('');
  const [stockCost, setStockCost] = useState('');
  const [stockQty, setStockQty] = useState('1');
  const [addingStock, setAddingStock] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const v = await getVariantDetail(id);
      if (!v) {
        setError('Variant not found');
        return;
      }
      setVariant(v);
      setPriceInput(String(v.sellingPrice ?? ''));
      setStorageInput(v.storageGb != null ? String(v.storageGb) : '');
      setConditionInput(v.condition ?? '');
      setPtaInput(v.ptaStatus ?? '');
      setColorsInput((v.availableColors ?? []).join(', '));
      navigation.setOptions?.({ title: v.modelName });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load variant');
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const onSavePrice = async () => {
    if (!variant) return;
    const parsed = Number(priceInput.replace(/[, ]/g, ''));
    if (!isFinite(parsed) || parsed < 0) {
      setError('Enter a valid price');
      return;
    }
    setSavingPrice(true);
    setError(null);
    try {
      await updateVariantPrice(variant.id, parsed);
      setVariant({ ...variant, sellingPrice: parsed });
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2000);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save price');
    } finally {
      setSavingPrice(false);
    }
  };

  const onSaveDetails = async () => {
    if (!variant) return;
    const storageGb = storageInput.trim() === '' ? null : parseInt(storageInput.trim(), 10);
    if (storageGb !== null && (!Number.isInteger(storageGb) || storageGb < 0)) {
      setError('Enter a valid storage (GB) or leave it blank');
      return;
    }
    if (!conditionInput) {
      setError('Pick a condition');
      return;
    }
    const availableColors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    setSavingDetails(true);
    setError(null);
    try {
      await updateVariantFields(variant.id, {
        storageGb,
        condition: conditionInput,
        ptaStatus: ptaInput || null,
        availableColors,
      });
      setVariant({
        ...variant,
        storageGb,
        condition: conditionInput,
        ptaStatus: ptaInput || null,
        availableColors,
      });
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2000);
    } catch (e: any) {
      // Most likely a uniqueness clash on (model, storage, pta, condition).
      const msg = /duplicate|unique/i.test(e?.message ?? '')
        ? 'Another variant of this model already has that storage + condition + PTA combo.'
        : e?.message ?? 'Failed to save details';
      setError(msg);
    } finally {
      setSavingDetails(false);
    }
  };

  const onToggleActive = async (value: boolean) => {
    if (!variant) return;
    setTogglingActive(true);
    try {
      await toggleVariantActive(variant.id, value);
      setVariant({ ...variant, isActive: value });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update visibility');
    } finally {
      setTogglingActive(false);
    }
  };

  // Move-color panel state (Option A): reclassify one color into another config.
  const [moveColor, setMoveColor] = useState<string | null>(null);
  const [moveStorage, setMoveStorage] = useState('');
  const [movePta, setMovePta] = useState('');
  const [moveCondition, setMoveCondition] = useState('');
  const [movingColor, setMovingColor] = useState(false);
  const [moveDone, setMoveDone] = useState<string | null>(null);

  const openMove = (color: string) => {
    if (!variant) return;
    setMoveColor(color);
    setMoveDone(null);
    setError(null);
    setMoveStorage(variant.storageGb != null ? String(variant.storageGb) : '');
    setMoveCondition(variant.condition ?? 'used');
    // Default PTA to the opposite of the current one — the common "fix PTA" case.
    setMovePta(variant.ptaStatus === 'pta_approved' ? 'non_pta' : 'pta_approved');
  };

  const onMove = async () => {
    if (!variant || !moveColor) return;
    const storageGb = moveStorage.trim() === '' ? null : parseInt(moveStorage.trim(), 10);
    if (storageGb !== null && (!Number.isInteger(storageGb) || storageGb < 0)) {
      setError('Enter a valid storage (GB) or leave it blank');
      return;
    }
    if (!moveCondition) {
      setError('Pick a condition for the destination config');
      return;
    }
    setMovingColor(true);
    setError(null);
    try {
      const res = await moveVariantColor({
        variantId: variant.id,
        color: moveColor,
        targetStorageGb: storageGb,
        targetPta: movePta || null,
        targetCondition: moveCondition,
      });
      if (!res.success) {
        setError(res.error ?? 'Could not move this color');
        return;
      }
      const moved = moveColor;
      setMoveColor(null);
      setMoveDone(`Moved ${res.moved ?? 0} ${moved} unit(s) to the new config.`);
      setTimeout(() => setMoveDone(null), 3500);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to move color');
    } finally {
      setMovingColor(false);
    }
  };

  const [togglingColor, setTogglingColor] = useState<string | null>(null);
  const onToggleColor = async (color: string, active: boolean) => {
    if (!variant) return;
    setTogglingColor(color);
    setError(null);
    try {
      const next = await setVariantColorActive(variant.id, color, active, variant.inactiveColors);
      setVariant({ ...variant, inactiveColors: next });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update color');
    } finally {
      setTogglingColor(null);
    }
  };

  const onPickAndUpload = async () => {
    if (!variant) return;
    try {
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Photo library permission is required to upload images.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: false,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setUploading(true);
      setError(null);
      const img = await uploadVariantImage(
        variant.id,
        { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType },
        { color: uploadColor }
      );
      setVariant({ ...variant, images: [...variant.images, img] });
    } catch (e: any) {
      setError('Upload failed: ' + (e?.message ?? 'unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const onSetPrimary = async (img: VariantImage) => {
    if (!variant || img.isPrimary) return;
    try {
      await setPrimaryImage(img.id, variant.id, img.color);
      // Only images of the SAME color change primary.
      setVariant({
        ...variant,
        images: variant.images.map((i) =>
          (i.color ?? null) === (img.color ?? null) ? { ...i, isPrimary: i.id === img.id } : i
        ),
      });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to set primary image');
    }
  };

  const onDeleteImage = async (img: VariantImage) => {
    if (!variant) return;
    const ok = await confirmAsync('Delete image', 'Remove this image from the variant?');
    if (!ok) return;
    try {
      await deleteVariantImage(img.id, variant.id);
      setVariant({ ...variant, images: variant.images.filter((i) => i.id !== img.id) });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to delete image');
    }
  };

  const onAddStock = async () => {
    if (!variant) return;
    const cost = Number(stockCost.replace(/[, ]/g, ''));
    const qty = parseInt(stockQty, 10);
    if (!isFinite(cost) || cost < 0) {
      setError('Enter a valid cost price');
      return;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Enter a valid quantity');
      return;
    }
    setAddingStock(true);
    setError(null);
    try {
      const res = await addStock({
        variantId: variant.id,
        color: stockColor.trim() || null,
        costPrice: cost,
        quantity: qty,
      });
      setStockColor('');
      setStockCost('');
      setStockQty('1');
      // Refresh to reflect new stock count.
      await load();
      if (Platform.OS !== 'web') {
        Alert.alert('Stock added', `${res.productsCreated} item(s) created.`);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add stock');
    } finally {
      setAddingStock(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!variant) {
    return (
      <View style={styles.center}>
        <Text testID="detail-error" style={styles.errorText}>
          {error ?? 'Variant not found'}
        </Text>
      </View>
    );
  }

  const primary = variant.images.find((i) => i.isPrimary) ?? variant.images[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="variant-detail">
      {/* Hero */}
      <View style={styles.hero}>
        {primary ? (
          <Image source={{ uri: primary.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>No image</Text>
          </View>
        )}
        <Text style={styles.title}>{variant.modelName}</Text>
        <Text style={styles.subtitle}>{variant.brandName}</Text>
        <View style={styles.metaRow}>
          {variant.storageGb ? <Chip label={`${variant.storageGb} GB`} /> : null}
          <Chip label={conditionLabel(variant.condition)} />
          {ptaLabel(variant.ptaStatus) ? <Chip label={ptaLabel(variant.ptaStatus)!} /> : null}
        </View>
      </View>

      {error ? (
        <Text testID="detail-error" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}

      {/* Price card */}
      <Section title="Selling price">
        {variant.availableColors.length > 1 ? (
          <ScopeBanner colors={variant.availableColors} />
        ) : null}
        <View style={styles.priceEditRow}>
          <View style={styles.priceInputWrap}>
            <Text style={styles.currencyPrefix}>Rs</Text>
            <TextInput
              testID="price-input"
              style={styles.priceInput}
              keyboardType="numeric"
              value={priceInput}
              onChangeText={(t) => {
                setPriceInput(t);
                setPriceSaved(false);
              }}
            />
          </View>
          <TouchableOpacity
            testID="save-price-button"
            style={[styles.saveBtn, savingPrice ? styles.btnDisabled : null]}
            disabled={savingPrice}
            onPress={onSavePrice}
          >
            {savingPrice ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        {priceSaved ? (
          <Text testID="price-saved" style={styles.savedText}>
            ✓ Saved · {formatPkr(variant.sellingPrice)}
          </Text>
        ) : (
          <Text style={styles.hintText}>
            Avg cost {formatPkr(variant.avgCostPrice)} · also updates linked products
          </Text>
        )}
      </Section>

      {/* Editable details */}
      <Section title="Details">
        {variant.availableColors.length > 1 ? (
          <ScopeBanner colors={variant.availableColors} />
        ) : null}
        <Text style={styles.fieldLabel}>Storage (GB)</Text>
        <TextInput
          testID="storage-input"
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 128 (blank = N/A)"
          placeholderTextColor={colors.textMuted}
          value={storageInput}
          onChangeText={(t) => {
            setStorageInput(t);
            setDetailsSaved(false);
          }}
        />

        <Text style={styles.fieldLabel}>Condition</Text>
        <View style={styles.segmentRow}>
          {CONDITIONS.map((c) => (
            <TouchableOpacity
              key={c.value}
              testID={`condition-${c.value}`}
              style={[styles.segment, conditionInput === c.value ? styles.segmentActive : null]}
              onPress={() => {
                setConditionInput(c.value);
                setDetailsSaved(false);
              }}
            >
              <Text
                style={[
                  styles.segmentText,
                  conditionInput === c.value ? styles.segmentTextActive : null,
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>PTA status</Text>
        <View style={styles.segmentRow}>
          {PTA_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.value || 'none'}
              testID={`pta-${p.value || 'none'}`}
              style={[styles.segment, ptaInput === p.value ? styles.segmentActive : null]}
              onPress={() => {
                setPtaInput(p.value);
                setDetailsSaved(false);
              }}
            >
              <Text
                style={[styles.segmentText, ptaInput === p.value ? styles.segmentTextActive : null]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Colors (comma-separated)</Text>
        <TextInput
          testID="colors-input"
          style={styles.input}
          placeholder="e.g. Obsidian, Peony"
          placeholderTextColor={colors.textMuted}
          value={colorsInput}
          onChangeText={(t) => {
            setColorsInput(t);
            setDetailsSaved(false);
          }}
        />

        <TouchableOpacity
          testID="save-details-button"
          style={[styles.saveBtnWide, savingDetails ? styles.btnDisabled : null]}
          disabled={savingDetails}
          onPress={onSaveDetails}
        >
          {savingDetails ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save details</Text>
          )}
        </TouchableOpacity>
        {detailsSaved ? (
          <Text testID="details-saved" style={styles.savedText}>
            ✓ Details saved
          </Text>
        ) : null}
      </Section>

      {/* Visibility + stock */}
      <Section title="Status">
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>Visible in catalog</Text>
            <Text style={styles.hintText}>
              {variant.stockCount} in stock{variant.availableColors.length > 1 ? ' · master switch for all colors' : ''}
            </Text>
          </View>
          <Switch
            testID="active-switch"
            value={variant.isActive}
            disabled={togglingActive}
            onValueChange={onToggleActive}
            trackColor={{ true: colors.primary }}
          />
        </View>

        {variant.availableColors.length > 0 ? (
          <View style={styles.colorStatusBlock}>
            <Text style={styles.colorStatusTitle}>Per-color · visibility &amp; config</Text>
            {variant.availableColors.map((c) => {
              const active = !variant.inactiveColors.includes(c);
              return (
                <View key={c} testID={`color-status-${c}`}>
                  <View style={styles.colorStatusRow}>
                    <Text style={[styles.colorStatusName, !active && styles.colorStatusOff]}>
                      {c}
                      {!active ? ' · hidden' : ''}
                    </Text>
                    <View style={styles.colorRowRight}>
                      <TouchableOpacity
                        testID={`move-color-${c}`}
                        style={styles.moveBtn}
                        onPress={() => (moveColor === c ? setMoveColor(null) : openMove(c))}
                      >
                        <Text style={styles.moveBtnText}>{moveColor === c ? 'Close' : 'Move →'}</Text>
                      </TouchableOpacity>
                      <Switch
                        testID={`color-switch-${c}`}
                        value={variant.isActive && active}
                        disabled={!variant.isActive || togglingColor === c}
                        onValueChange={(val) => onToggleColor(c, val)}
                        trackColor={{ true: colors.primary }}
                      />
                    </View>
                  </View>

                  {moveColor === c ? (
                    <View style={styles.movePanel} testID={`move-panel-${c}`}>
                      <Text style={styles.movePanelTitle}>Move “{c}” to a different config</Text>
                      <Text style={styles.movePanelHint}>
                        Reassigns only {c}’s units — other colors stay put. Creates the destination
                        config if it doesn’t exist yet.
                      </Text>

                      <Text style={styles.fieldLabel}>Storage (GB)</Text>
                      <TextInput
                        testID="move-storage-input"
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="e.g. 128 (blank = N/A)"
                        placeholderTextColor={colors.textMuted}
                        value={moveStorage}
                        onChangeText={setMoveStorage}
                      />

                      <Text style={styles.fieldLabel}>PTA status</Text>
                      <View style={styles.segmentRow}>
                        {PTA_OPTIONS.map((p) => (
                          <TouchableOpacity
                            key={p.value || 'none'}
                            testID={`move-pta-${p.value || 'none'}`}
                            style={[styles.segment, movePta === p.value ? styles.segmentActive : null]}
                            onPress={() => setMovePta(p.value)}
                          >
                            <Text
                              style={[
                                styles.segmentText,
                                movePta === p.value ? styles.segmentTextActive : null,
                              ]}
                            >
                              {p.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={styles.fieldLabel}>Condition</Text>
                      <View style={styles.segmentRow}>
                        {CONDITIONS.map((cc) => (
                          <TouchableOpacity
                            key={cc.value}
                            testID={`move-condition-${cc.value}`}
                            style={[styles.segment, moveCondition === cc.value ? styles.segmentActive : null]}
                            onPress={() => setMoveCondition(cc.value)}
                          >
                            <Text
                              style={[
                                styles.segmentText,
                                moveCondition === cc.value ? styles.segmentTextActive : null,
                              ]}
                            >
                              {cc.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        testID="move-confirm-button"
                        style={[styles.saveBtnWide, movingColor ? styles.btnDisabled : null]}
                        disabled={movingColor}
                        onPress={onMove}
                      >
                        {movingColor ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.saveBtnText}>Move {c}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })}
            {moveDone ? (
              <Text testID="move-done" style={styles.savedText}>
                ✓ {moveDone}
              </Text>
            ) : null}
            {!variant.isActive ? (
              <Text style={styles.hintText}>Turn the variant on above to control individual colors.</Text>
            ) : null}
          </View>
        ) : null}
      </Section>

      {/* Images */}
      <Section title="Images">
        {variant.availableColors.length > 0 ? (
          <>
            <Text style={styles.fieldLabel}>Color — pick which color these images belong to</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorPickerRow}
            >
              <TouchableOpacity
                testID="upload-color-all"
                style={[styles.colorChip, uploadColor === null ? styles.colorChipActive : null]}
                onPress={() => setUploadColor(null)}
              >
                <Text
                  style={[
                    styles.colorChipText,
                    uploadColor === null ? styles.colorChipTextActive : null,
                  ]}
                >
                  All colors
                </Text>
              </TouchableOpacity>
              {variant.availableColors.map((c) => (
                <TouchableOpacity
                  key={c}
                  testID={`upload-color-${c}`}
                  style={[styles.colorChip, uploadColor === c ? styles.colorChipActive : null]}
                  onPress={() => setUploadColor(c)}
                >
                  <Text
                    style={[
                      styles.colorChipText,
                      uploadColor === c ? styles.colorChipTextActive : null,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        <Text style={styles.imagesForLabel}>
          {(() => {
            const shown = variant.images.filter((i) => (i.color ?? null) === uploadColor).length;
            const label = uploadColor ?? 'All colors';
            return `${shown} image${shown === 1 ? '' : 's'} for ${label}`;
          })()}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageStrip}>
          {variant.images
            .filter((img) => (img.color ?? null) === uploadColor)
            .map((img) => (
            <View key={img.id} style={styles.imageCard} testID={`image-${img.id}`}>
              <Image source={{ uri: img.imageUrl }} style={styles.imageThumb} />
              {img.isPrimary ? (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              ) : null}
              <View style={styles.imageColorTag}>
                <Text style={styles.imageColorTagText}>{img.color ?? 'All'}</Text>
              </View>
              <View style={styles.imageActions}>
                {!img.isPrimary ? (
                  <TouchableOpacity onPress={() => onSetPrimary(img)} testID={`set-primary-${img.id}`}>
                    <Text style={styles.imageActionText}>Set primary</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
                <TouchableOpacity onPress={() => onDeleteImage(img)} testID={`delete-image-${img.id}`}>
                  <Text style={[styles.imageActionText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            testID="upload-image-button"
            style={styles.uploadCard}
            onPress={onPickAndUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.uploadPlus}>+</Text>
                <Text style={styles.uploadText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Section>

      {/* Add stock */}
      <Section title="Add stock">
        <Text style={styles.fieldLabel}>Color (optional)</Text>
        <TextInput
          testID="stock-color-input"
          style={styles.input}
          placeholder={variant.availableColors[0] ?? 'e.g. Obsidian'}
          placeholderTextColor={colors.textMuted}
          value={stockColor}
          onChangeText={setStockColor}
        />
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Cost price</Text>
            <TextInput
              testID="stock-cost-input"
              style={styles.input}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={stockCost}
              onChangeText={setStockCost}
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              testID="stock-qty-input"
              style={styles.input}
              keyboardType="numeric"
              value={stockQty}
              onChangeText={setStockQty}
            />
          </View>
        </View>
        <TouchableOpacity
          testID="add-stock-button"
          style={[styles.addStockBtn, addingStock ? styles.btnDisabled : null]}
          disabled={addingStock}
          onPress={onAddStock}
        >
          {addingStock ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Add to inventory</Text>
          )}
        </TouchableOpacity>
      </Section>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

// Warns that a config-wide field (price, storage, PTA, condition) affects every
// color of this config. To change one color only, use the per-color "Move".
function ScopeBanner({ colors: colorList }: { colors: string[] }) {
  return (
    <View style={styles.scopeBanner} testID="scope-banner">
      <Text style={styles.scopeBannerText}>
        ⚠ Applies to all {colorList.length} colors ({colorList.join(', ')}). To change one color
        only, use “Move →” below.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  errorText: { color: colors.danger, fontSize: 15 },
  errorBanner: { backgroundColor: '#fee2e2', color: colors.danger, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 4 },
  hero: { backgroundColor: colors.card, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  heroImage: { width: 160, height: 160, borderRadius: 14, backgroundColor: '#f1f5f9' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { color: colors.textMuted },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, justifyContent: 'center' },
  chip: { backgroundColor: colors.chipBg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { color: colors.chipText, fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  priceEditRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  priceInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  currencyPrefix: { color: colors.textMuted, fontSize: 16, marginRight: 6 },
  priceInput: { flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: '700', color: colors.text },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 22, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', minWidth: 84 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
  savedText: { color: colors.success, fontSize: 13, marginTop: 10, fontWeight: '600' },
  hintText: { color: colors.textMuted, fontSize: 12, marginTop: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  colorStatusBlock: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  colorStatusTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  colorStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  colorStatusName: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  colorStatusOff: { color: colors.textMuted },
  colorRowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  moveBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#fff' },
  moveBtnText: { color: colors.primary, fontSize: 12.5, fontWeight: '700' },
  movePanel: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 8, marginBottom: 6 },
  movePanelTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 },
  movePanelHint: { fontSize: 12, color: colors.textMuted, marginBottom: 8, lineHeight: 17 },
  scopeBanner: { backgroundColor: '#fef3c7', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  scopeBannerText: { color: '#92400e', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  colorPickerRow: { flexDirection: 'row', marginBottom: 12 },
  colorChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  colorChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  colorChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  colorChipTextActive: { color: '#fff' },
  imageColorTag: {
    position: 'absolute',
    bottom: 36,
    left: 6,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageColorTagText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  imagesForLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8 },
  imageStrip: { flexDirection: 'row' },
  imageCard: { marginRight: 12, width: 120 },
  imageThumb: { width: 120, height: 120, borderRadius: 10, backgroundColor: '#f1f5f9' },
  primaryBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.primary, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  imageActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  imageActionText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  uploadCard: { width: 120, height: 120, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff' },
  uploadPlus: { fontSize: 32, color: colors.primary, fontWeight: '300' },
  uploadText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: colors.text, backgroundColor: '#fff' },
  twoCol: { flexDirection: 'row', gap: 12, marginTop: 4 },
  col: { flex: 1 },
  addStockBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: '#fff' },
  saveBtnWide: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
});
