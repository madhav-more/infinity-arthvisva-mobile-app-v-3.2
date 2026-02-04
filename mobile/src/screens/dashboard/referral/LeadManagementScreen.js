import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardService } from '../../../services/dashboardService';
import ReferralLeadModal from './ReferralLeadModal';
import { useFocusEffect } from '@react-navigation/native';
import theme from '../../../constants/theme';
import LeadFormDataModal from './LeadFormDataModal';
import LeadDocumentsModal from './LeadDocumentsModal';

/**
 * Premium Lead Management Screen
 * Features:
 * - Responsive Flex Table (No horizontal/vertical intra-table scroll)
 * - Intelligent Data Grouping (Stacked rows for space efficiency)
 * - Top-aligned instant Add Menu
 */
export default function LeadManagementScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('referral'); // 'referral' or 'detailed'
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);

    // UI State
    const [isAddMenuVisible, setIsAddMenuVisible] = useState(false);
    const [showPageSizePicker, setShowPageSizePicker] = useState(false);

    // Modals
    const [isReferralModalVisible, setIsReferralModalVisible] = useState(false);
    const [selectedLeadForDocs, setSelectedLeadForDocs] = useState(null);
    const [isDocsModalVisible, setIsDocsModalVisible] = useState(false);
    const [selectedLeadForForm, setSelectedLeadForForm] = useState(null);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);

    const pageSizeOptions = [5, 10, 15, 20, 50, 'All'];

    const fetchLeads = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = activeTab === 'referral'
                ? await DashboardService.getLeads()
                : await DashboardService.getMyLeads();

            if (response.success && Array.isArray(response.data)) {
                if (activeTab === 'referral') {
                    setLeads(response.data);
                } else {
                    const mapped = response.data.map(item => ({
                        id: item.id,
                        ref_id: item.detail_lead_id,
                        lead_name: item.lead_name || item.form_data?.clientName || item.client?.name || "N/A",
                        contact_number: item.contact_number || item.form_data?.phone || item.client?.mobile || "N/A",
                        sub_category: item.sub_category || "-",
                        is_self_login: item.meta?.is_self_login ? "Yes" : "No",
                        created_at: item.created_at,
                        original: item
                    }));
                    setLeads(mapped);
                }
            } else {
                setLeads([]);
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            fetchLeads(true);
            return () => {
                setIsAddMenuVisible(false);
                setShowPageSizePicker(false);
            };
        }, [fetchLeads])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeads(false);
    };

    const toggleAddMenu = () => setIsAddMenuVisible(!isAddMenuVisible);

    const handleSelectAddOption = (option) => {
        setIsAddMenuVisible(false);
        if (option === 'referral') setIsReferralModalVisible(true);
        else navigation.navigate('AddDetailedLead');
    };

    const filteredLeads = leads.filter(lead => {
        const query = searchQuery.toLowerCase();
        return (
            (lead.lead_name && lead.lead_name.toLowerCase().includes(query)) ||
            (lead.ref_id && lead.ref_id.toString().toLowerCase().includes(query)) ||
            (lead.contact_number && lead.contact_number.includes(query))
        );
    });

    const paginatedLeads = pageSize === 'All' ? filteredLeads : filteredLeads.slice(0, pageSize);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    // --- TABLE COMPONENTS ---
    const TableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.7 }]}>ID / DT</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Lead Information</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Contact / Product</Text>
            <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Status</Text>
        </View>
    );

    const renderItem = ({ item, index }) => (
        <View style={[styles.row, index % 2 === 1 && styles.rowAlternate]}>
            {/* Col 1: ID & Short Date */}
            <View style={{ flex: 0.7 }}>
                <Text style={styles.idText}>#{item.id}</Text>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>

            {/* Col 2: Name & Ref ID */}
            <View style={{ flex: 2 }}>
                <Text style={styles.nameText} numberOfLines={1}>{item.lead_name}</Text>
                <Text style={styles.refIdText} numberOfLines={1}>{item.ref_id || 'REF-N/A'}</Text>
            </View>

            {/* Col 3: Contact & Sub-Cat / Product */}
            <View style={{ flex: 1.5 }}>
                <Text style={styles.contactText}>{item.contact_number || '-'}</Text>
                <Text style={styles.productText} numberOfLines={1}>
                    {activeTab === 'referral' ? (item.department || '-') : (item.sub_category || '-')}
                </Text>
            </View>

            {/* Col 4: Status or Actions */}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                {activeTab === 'referral' ? (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{item.status?.toUpperCase() || 'PENDING'}</Text>
                    </View>
                ) : (
                    <View style={styles.actionGroup}>
                        <TouchableOpacity
                            style={styles.iconAction}
                            onPress={() => { setSelectedLeadForDocs(item); setIsDocsModalVisible(true); }}
                        >
                            <Ionicons name="document-text" size={14} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconAction}
                            onPress={() => { setSelectedLeadForForm(item); setIsFormModalVisible(true); }}
                        >
                            <Ionicons name="eye" size={14} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

            {/* TOP BAR / CONTROLS */}
            <View style={styles.controlsRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={theme.colors.textSecondary}
                    />
                </View>

                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setShowPageSizePicker(!showPageSizePicker)}
                >
                    <Text style={styles.filterText}>{pageSize === 'All' ? 'All' : pageSize}</Text>
                    <Ionicons name="chevron-down" size={14} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={{ zIndex: 100 }}>
                    <TouchableOpacity style={styles.addBtn} onPress={toggleAddMenu}>
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* INSTANT TOP MENU */}
                    {isAddMenuVisible && (
                        <View style={styles.topMenu}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => handleSelectAddOption('referral')}>
                                <Ionicons name="person-add" size={16} color={theme.colors.primary} />
                                <Text style={styles.menuItemText}>Referral</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.menuItem, styles.menuBorder]} onPress={() => handleSelectAddOption('detailed')}>
                                <Ionicons name="list" size={16} color={theme.colors.success} />
                                <Text style={styles.menuItemText}>Detailed</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* PAGE SIZE PICKER */}
            {showPageSizePicker && (
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerWindow}>
                        {pageSizeOptions.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.pickerOption, pageSize === opt && styles.pickerOptionActive]}
                                onPress={() => { setPageSize(opt); setShowPageSizePicker(false); }}
                            >
                                <Text style={[styles.pickerLabel, pageSize === opt && styles.pickerLabelActive]}>{opt} Items</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* TABS CONTROLLER */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'referral' && styles.tabActive]}
                    onPress={() => setActiveTab('referral')}
                >
                    <Text style={[styles.tabLabel, activeTab === 'referral' && styles.tabLabelActive]}>Referral</Text>
                    <View style={styles.tag}><Text style={styles.tagText}>{activeTab === 'referral' ? leads.length : '-'}</Text></View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'detailed' && styles.tabActive]}
                    onPress={() => setActiveTab('detailed')}
                >
                    <Text style={[styles.tabLabel, activeTab === 'detailed' && styles.tabLabelActive]}>Detailed</Text>
                    <View style={styles.tag}><Text style={styles.tagText}>{activeTab === 'detailed' ? leads.length : '-'}</Text></View>
                </TouchableOpacity>
            </View>

            {/* MAIN TABLE CONTENT */}
            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={paginatedLeads}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    ListHeaderComponent={TableHeader}
                    stickyHeaderIndices={[0]}
                    contentContainerStyle={styles.tableBody}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="file-tray-outline" size={40} color="#CBD5E1" />
                            <Text style={styles.emptyMsg}>No results found</Text>
                        </View>
                    }
                />
            )}

            {/* MODALS */}
            <ReferralLeadModal visible={isReferralModalVisible} onClose={() => setIsReferralModalVisible(false)} onSuccess={() => fetchLeads(false)} />
            <LeadDocumentsModal visible={isDocsModalVisible} onClose={() => setIsDocsModalVisible(false)} lead={selectedLeadForDocs} />
            <LeadFormDataModal visible={isFormModalVisible} onClose={() => setIsFormModalVisible(false)} lead={selectedLeadForForm} />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    controlsRow: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 12,
        zIndex: 50,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...theme.shadow,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B' },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    filterText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    addBtn: {
        width: 48,
        height: 48,
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadow,
    },
    topMenu: {
        position: 'absolute',
        top: 56,
        right: 0,
        width: 150,
        backgroundColor: '#FFF',
        borderRadius: 16,
        ...theme.shadow,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    menuBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    menuItemText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },

    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 42,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10
    },
    tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    tabLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    tabLabelActive: { color: '#FFF' },
    tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, borderRadius: 8 },
    tagText: { fontSize: 11, fontWeight: '700', color: '#475569' },

    tableBody: { paddingHorizontal: 16, paddingBottom: 50 },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerCell: { fontSize: 11, fontWeight: '800', color: '#64748B' },

    row: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    rowAlternate: { backgroundColor: '#FBFCFE' },

    idText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
    dateText: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
    nameText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    refIdText: { fontSize: 11, color: '#64748B', marginTop: 1 },
    contactText: { fontSize: 13, fontWeight: '600', color: '#334155' },
    productText: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
    statusBadge: { backgroundColor: '#F0F9FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '800', color: '#0369A1' },

    actionGroup: { flexDirection: 'row', gap: 6 },
    iconAction: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
    pickerWindow: {
        position: 'absolute',
        top: 70,
        right: 70,
        width: 130,
        backgroundColor: '#FFF',
        borderRadius: 16,
        ...theme.shadow,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pickerOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    pickerLabel: { fontSize: 13, color: '#444', textAlign: 'center' },
    pickerLabelActive: { color: theme.colors.primary, fontWeight: '700' },

    loader: { flex: 1, justifyContent: 'center', paddingTop: 100 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyMsg: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
});
