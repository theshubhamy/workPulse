import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Colors } from '../utils/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  rightIcon,
  leftIcon,
  secureTextEntry,
  // Destructure event handlers from props so we can merge them
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  autoFocus,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocusProp?.(e); // call parent handler if provided
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlurProp?.(e); // call parent handler if provided
  };

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          focused && styles.focused,
          error ? styles.errorBorder : null,
        ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          // Merge focus/blur so our state always fires alongside parent callbacks
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={hidden}
          // Safe defaults — all overridable via props
          autoFocus={autoFocus ?? false}   // ← prevents keyboard on mount
          autoCapitalize="sentences"        // overridden per-field via props
          autoCorrect={false}
          autoComplete="off"
          cursorColor={Colors.primaryLight}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setHidden(h => !h)}
            style={styles.rightIcon}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.eyeIcon}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  focused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 14,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
  },
});

export default Input;
