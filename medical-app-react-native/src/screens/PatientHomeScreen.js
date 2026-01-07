import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

const PatientHomeScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [connectedDoctors, setConnectedDoctors] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setError('');

    // Simulate loading data (no API)
    setTimeout(() => {
      const user = route.params?.user || {
        full_name: 'John Doe',
      };

      setCurrentUser(user);

      setConnectedDoctors([
        {
          id: 1,
          name: 'Dr. Sarah Williams',
          specialty: 'Cardiologist',
        },
        {
          id: 2,
          name: 'Dr. Michael Chen',
          specialty: 'General Practitioner',
        },
      ]);

      setRecentRecords([
        {
          id: 1,
          title: 'Blood Test',
          date: 'Jan 5, 2026',
        },
        {
          id: 2,
          title: 'X-Ray Results',
          date: 'Dec 28, 2025',
        },
        {
          id: 3,
          title: 'Prescription',
          date: 'Dec 20, 2025',
        },
        {
          id: 4,
          title: 'Consultation Notes',
          date: 'Dec 15, 2025',
        },
      ]);

      setUpcomingAppointments([
        {
          id: 1,
          time: 'Jan 10, 2026 - 2:00 PM',
          doctor: 'Dr. Sarah Williams',
          type: 'Cardiology Follow-up',
        },
        {
          id: 2,
          time: 'Jan 15, 2026 - 10:30 AM',
          doctor: 'Dr. Michael Chen',
          type: 'General Checkup',
        },
      ]);

      setLoading(false);
    }, 1000);
  };

  const logout = () => {
    navigation.replace('Login');
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
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View>
              <Text style={styles.greeting}>
                Hello, {currentUser?.full_name || 'Patient'}
              </Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={logout}>
            <Text style={styles.iconBtnText}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Connected Doctors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected Doctors</Text>

            {connectedDoctors.map((doctor) => (
              <View key={doctor.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.avatarSmall}>👨‍⚕️</Text>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{doctor.name}</Text>
                    <Text style={styles.cardSubtext}>{doctor.specialty}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.btnPrimary}>
                    <Text style={styles.btnText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {connectedDoctors.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No connected doctors yet</Text>
                <TouchableOpacity style={styles.btnSecondary}>
                  <Text style={styles.btnText}>Find Doctors</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Medical Records */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Records</Text>

            <View style={styles.recordsGrid}>
              {recentRecords.map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <Text style={styles.recordIcon}>📄</Text>
                  <Text style={styles.recordTitle}>{record.title}</Text>
                  <Text style={styles.recordDate}>{record.date}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Upload New Record</Text>
            </TouchableOpacity>
          </View>

          {/* Upcoming Appointments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>

            {upcomingAppointments.map((apt) => (
              <View key={apt.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTime}>
                  <Text style={styles.timeIcon}>🕐</Text>
                  <Text style={styles.timeText}>{apt.time}</Text>
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentDoctor}>{apt.doctor}</Text>
                  <Text style={styles.appointmentType}>{apt.type}</Text>
                </View>
              </View>
            ))}

            {upcomingAppointments.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No upcoming appointments</Text>
              </View>
            )}
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
          <Text style={styles.navText}>Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>Records</Text>
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
  date: {
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
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DD',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarSmall: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0D9488',
    borderRadius: 10,
  },
  btnSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FB923C',
    borderRadius: 10,
  },
  btnOutline: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0D9488',
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  btnOutlineText: {
    color: '#0D9488',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    marginBottom: 16,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  recordCard: {
    width: '48%',
    backgroundColor: '#FFFBF7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DD',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  appointmentCard: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DD',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    fontSize: 16,
  },
  timeText: {
    color: '#0D9488',
    fontWeight: '600',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 13,
    color: '#6B7280',
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

export default PatientHomeScreen;
