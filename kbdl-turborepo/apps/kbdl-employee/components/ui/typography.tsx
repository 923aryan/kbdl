import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { typography } from '@/constants/typography';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'button' | 'caption';

interface Props extends TextProps {
  variant?: Variant;
  style?: TextStyle | TextStyle[];
}

export function Typography({ variant = 'body', style, children, ...props }: Props) {
  return (
    <Text style={[styles[variant], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create(typography);
