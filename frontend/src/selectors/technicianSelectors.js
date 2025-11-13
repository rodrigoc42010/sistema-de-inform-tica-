import { createSelector } from '@reduxjs/toolkit';

// Selector base para o technician state
const selectTechnicians = (state) => state.technicians;

// Selectors memoizados
export const selectTopTechnicians = createSelector(
  [selectTechnicians],
  (technicians) => {
    const top = technicians?.topTechnicians;
    if (Array.isArray(top)) return top;
    if (Array.isArray(top?.data)) return top.data;
    return [];
  }
);

export const selectAllTechnicians = createSelector(
  [selectTechnicians],
  (technicians) => technicians?.technicians || []
);

export const selectCurrentTechnician = createSelector(
  [selectTechnicians],
  (technicians) => technicians?.technician || {}
);

export const selectTechniciansLoading = createSelector(
  [selectTechnicians],
  (technicians) => technicians?.isLoading || false
);

export const selectTechniciansError = createSelector(
  [selectTechnicians],
  (technicians) => technicians?.isError || false
);

export const selectTechniciansMessage = createSelector(
  [selectTechnicians],
  (technicians) => technicians?.message || ''
);