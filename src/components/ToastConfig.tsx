import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { Colors } from '../utils/colors';

const { width } = Dimensions.get('window');

/**
 * Custom styles for different toast types.
 * Designed to match the premium, vibrant theme of WorkPulse.
 */
export const toastConfig = {
  success: (props: BaseToastProps) => (
    <View style={[styles.toast, styles.successShadow]}>
      <View style={[styles.indicator, { backgroundColor: Colors.success }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subTitle}>{props.text2}</Text> : null}
      </View>
      <Text style={styles.emoji}>✅</Text>
    </View>
  ),
  error: (props: BaseToastProps) => (
    <View style={[styles.toast, styles.errorShadow]}>
      <View style={[styles.indicator, { backgroundColor: Colors.danger }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subTitle}>{props.text2}</Text> : null}
      </View>
      <Text style={styles.emoji}>❌</Text>
    </View>
  ),
  info: (props: BaseToastProps) => (
    <View style={[styles.toast, styles.infoShadow]}>
      <View style={[styles.indicator, { backgroundColor: Colors.primary }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{props.text1}</Text>
        {props.text2 ? <Text style={styles.subTitle}>{props.text2}</Text> : null}
      </View>
      <Text style={styles.emoji}>ℹ️</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toast: {
    height: 70,
    width: width * 0.9,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
  },
  indicator: {
    width: 6,
    height: '60%',
    borderRadius: 3,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emoji: {
    fontSize: 20,
  },
  successShadow: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  errorShadow: {
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  infoShadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
});
