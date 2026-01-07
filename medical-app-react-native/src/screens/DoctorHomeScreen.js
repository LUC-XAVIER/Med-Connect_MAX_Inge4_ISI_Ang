import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const DoctorHomeScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [todayCount, setTodayCount] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setError('');

    // Simulate loading data (no API)
    setTimeout(() => {
      const user = route.params?.user || {
        full_name: 'Dr. Smith',
        specialty: 'General Practitioner',
      };

      setCurrentUser(user);
      setTodayCount(3);
      setTotalPatients(24);

      setConnectionRequests([
        {
          id: 1,
          patient: 'Sarah Johnson',
          reason: 'Regular checkup needed',
          date: '2 hours ago',
        },
        {
          id: 2,
          patient: 'Mike Davis',
          reason: 'Follow-up consultation',
          date: '5 hours ago',
        },
      ]);

      setTodayAppointments([
        {
          id: 1,
          time: '10:00 AM',
          patient: 'Emma Wilson',
          type: 'General Consultation',
        },
        {
          id: 2,
          time: '2:00 PM',
          patient: 'James Brown',
          type: 'Follow-up',
        },
        {
          id: 3,
          time: '4:30 PM',
          patient: 'Lisa Anderson',
          type: 'Initial Consultation',
        },
      ]);

      setPatients([
        {
          id: 1,
          name: 'Emily Clark',
          age: 28,
          gender: 'Female',
          condition: 'Hypertension',
        },
        {
          id: 2,
          name: 'Robert Lee',
          age: 45,
          gender: 'Male',
          condition: 'Diabetes Type 2',
        },
        {
          id: 3,
          name: 'Anna Martinez',
          age: 34,
          gender: 'Female',
          condition: 'Asthma',
        },
      ]);

      setLoading(false);
    }, 1000);
  };

  const logout = () => {
    navigation.replace('Login');
  };

  const approveConnection = (id) => {
    setConnectionRequests(connectionRequests.filter((req) => req.id !== id));
  };

  const rejectConnection = (id) => {
    setConnectionRequests(connectionRequests.filter((req) => req.id !== id));
  };

  const startConsultation = (id) => {
    console.log('Starting consultation:', id);
  };

  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={loadData}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👨‍⚕️</Text>
            </View>
            <View>
              <Text style={styles.greeting}>
                Dr. {currentUser?.full_name || 'Doctor'}
              </Text>
              <Text style={styles.specialty}>
                {currentUser?.specialty || 'Medical Professional'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Text style={styles.iconBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.appointmentsCard]}>
            <Text style={styles.statIcon}>📅</Text>
            <View>
              <Text style={styles.statNumber}>{todayCount}</Text>
              <Text style={styles.statLabel}>Today's Appointments</Text>
            </View>
          </View>
          <View style={[styles.statCard, styles.patientsCard]}>
            <Text style={styles.statIcon}>👥</Text>
            <View>
              <Text style={styles.statNumber}>{totalPatients}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Connection Requests */}
          {connectionRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Connection Requests</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{connectionRequests.length}</Text>
                </View>
              </View>

              {connectionRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.avatarSmall}>👤</Text>
                    <View style={styles.requestDetails}>
                      <Text style={styles.requestName}>{request.patient}</Text>
                      <Text style={styles.requestReason}>{request.reason}</Text>
                      <Text style={styles.requestDate}>{request.date}</Text>
                    </View>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.btnApprove}
                      onPress={() => approveConnection(request.id)}
                    >
                      <Text style={styles.btnActionText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.btnReject}
                      onPress={() => rejectConnection(request.id)}
                    >
                      <Text style={styles.btnActionText}>✗</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Today's Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <TouchableOpacity>
                <Text style={styles.linkBtn}>View All</Text>
              </TouchableOpacity>
            </View>

            {todayAppointments.map((apt) => (
              <View key={apt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTime}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.timeText}>{apt.time}</Text>
                </View>
                <View style={styles.appointmentDetails}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.avatarSmall}>👤</Text>
                    <View>
                      <Text style={styles.patientName}>{apt.patient}</Text>
                      <Text style={styles.patientType}>{apt.type}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => startConsultation(apt.id)}
                  >
                    <Text style={styles.btnText}>Start</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {todayAppointments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No appointments scheduled for today
                </Text>
              </View>
            )}
          </View>

          {/* Recent Patients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Patients</Text>
              <TouchableOpacity>
                <Text style={styles.linkBtn}>View All</Text>
              </TouchableOpacity>
            </View>

            {patients.slice(0, 3).map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <Text style={styles.avatarSmall}>👤</Text>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientInfo}>
                    {patient.age} years • {patient.gender}
                  </Text>
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionText}>{patient.condition}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.btnIcon}>
                  <Text style={styles.iconBtnText}>💬</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navText}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navIcon}>📅</Text>
          <Text style={styles.navText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },
  scrollView: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(253, 248, 243, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FDF8F3',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DD',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#B5E5DD',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  specialty: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3E8DD',
  },
  appointmentsCard: {
    backgroundColor: '#E0F2FE',
  },
  patientsCard: {
    backgroundColor: '#FEF3C7',
  },
  statIcon: {
    fontSize: 28,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  linkBtn: {
    color: '#0D9488',
    fontWeight: '600',
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DD',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatarSmall: {
    fontSize: 24,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  requestReason: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnApprove: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReject: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionText: {
    color: 'white',
    fontSize: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DD',
    marginBottom: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeIcon: {
    fontSize: 16,
  },
  timeText: {
    color: '#0D9488',
    fontWeight: '600',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  patientType: {
    fontSize: 13,
    color: '#6B7280',
  },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0D9488',
    borderRadius: 10,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
  },
  patientCard: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DD',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  patientDetails: {
    flex: 1,
  },
  patientInfo: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  conditionBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 12,
    color: '#FB923C',
  },
  btnIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F3E8DD',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 24,
  },
  navBtn: {
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  navBtnActive: {
    backgroundColor: '#F0FDFA',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  navTextActive: {
    color: '#0D9488',
  },
});

export default DoctorHomeScreen;
