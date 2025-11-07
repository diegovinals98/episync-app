import React from 'react';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../styles/colors';

/**
 * Componente Skeleton mejorado usando react-native-skeleton-placeholder
 * Más profesional y con mejor animación
 */
const EnhancedSkeleton = ({ children, backgroundColor, highlightColor }) => {
  const { isDarkMode } = useTheme();

  return (
    <SkeletonPlaceholder
      backgroundColor={backgroundColor || (isDarkMode ? colors.dark.surfaceSecondary : colors.light.surfaceSecondary)}
      highlightColor={highlightColor || (isDarkMode ? colors.dark.surfaceTertiary : colors.light.surfaceTertiary)}
      speed={1200}
      borderRadius={8}
    >
      {children}
    </SkeletonPlaceholder>
  );
};

/**
 * Skeleton para tarjetas de grupo
 */
export const GroupCardSkeleton = () => {
  return (
    <EnhancedSkeleton>
      <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" padding={16} marginBottom={12} borderRadius={12}>
        <SkeletonPlaceholder.Item width={60} height={60} borderRadius={30} marginRight={12} />
        <SkeletonPlaceholder.Item flex={1}>
          <SkeletonPlaceholder.Item width="60%" height={16} marginBottom={8} />
          <SkeletonPlaceholder.Item width="40%" height={12} />
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder.Item>
    </EnhancedSkeleton>
  );
};

/**
 * Skeleton para tarjetas de serie
 */
export const SeriesCardSkeleton = () => {
  return (
    <EnhancedSkeleton>
      <SkeletonPlaceholder.Item marginBottom={16} borderRadius={12}>
        <SkeletonPlaceholder.Item width="100%" height={200} borderRadius={12} marginBottom={8} />
        <SkeletonPlaceholder.Item width="70%" height={16} marginBottom={4} />
        <SkeletonPlaceholder.Item width="50%" height={12} />
      </SkeletonPlaceholder.Item>
    </EnhancedSkeleton>
  );
};

/**
 * Skeleton para lista de episodios
 */
export const EpisodeListSkeleton = ({ count = 3 }) => {
  return (
    <EnhancedSkeleton>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonPlaceholder.Item
          key={index}
          flexDirection="row"
          alignItems="center"
          padding={12}
          marginBottom={8}
          borderRadius={8}
        >
          <SkeletonPlaceholder.Item width={50} height={30} borderRadius={6} marginRight={12} />
          <SkeletonPlaceholder.Item flex={1}>
            <SkeletonPlaceholder.Item width="80%" height={14} marginBottom={4} />
            <SkeletonPlaceholder.Item width="60%" height={12} />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item width={60} height={14} />
        </SkeletonPlaceholder.Item>
      ))}
    </EnhancedSkeleton>
  );
};

/**
 * Skeleton para header de pantalla
 */
export const HeaderSkeleton = () => {
  return (
    <EnhancedSkeleton>
      <SkeletonPlaceholder.Item flexDirection="row" alignItems="center" padding={16} justifyContent="space-between">
        <SkeletonPlaceholder.Item flexDirection="row" alignItems="center">
          <SkeletonPlaceholder.Item width={40} height={40} borderRadius={20} marginRight={12} />
          <SkeletonPlaceholder.Item>
            <SkeletonPlaceholder.Item width={120} height={18} marginBottom={4} />
            <SkeletonPlaceholder.Item width={80} height={14} />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>
        <SkeletonPlaceholder.Item width={40} height={40} borderRadius={20} />
      </SkeletonPlaceholder.Item>
    </EnhancedSkeleton>
  );
};

export default EnhancedSkeleton;

