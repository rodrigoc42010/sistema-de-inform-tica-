import { createSelector } from '@reduxjs/toolkit';

// Selector base para o auth state
const selectAuth = (state) => state.auth;

// Selectors memoizados
export const selectUser = createSelector(
  [selectAuth],
  (auth) => auth.user
);

export const selectUserRole = createSelector(
  [selectUser],
  (user) => user?.role || 'client'
);

export const selectIsLoading = createSelector(
  [selectAuth],
  (auth) => auth.isLoading
);

export const selectIsError = createSelector(
  [selectAuth],
  (auth) => auth.isError
);

export const selectIsSuccess = createSelector(
  [selectAuth],
  (auth) => auth.isSuccess
);

export const selectMessage = createSelector(
  [selectAuth],
  (auth) => auth.message
);

export const selectAuthState = createSelector(
  [selectUser, selectIsLoading, selectIsError, selectIsSuccess, selectMessage],
  (user, isLoading, isError, isSuccess, message) => ({
    user,
    isLoading,
    isError,
    isSuccess,
    message
  })
);