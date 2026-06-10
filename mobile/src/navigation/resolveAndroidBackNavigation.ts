import { CommonActions, type NavigationState, type PartialState } from "@react-navigation/native";

export type AndroidBackDispatch = (
  action: ReturnType<typeof CommonActions.navigate> | ReturnType<typeof CommonActions.goBack>
) => void;

type NavStateLike = NavigationState | PartialState<NavigationState>;

function nestedStackCanPop(state: NavStateLike | undefined): boolean {
  return (state?.index ?? 0) > 0;
}

/**
 * NavigationContainer-де canGoBack() false болғанда да артқа қадам (Android hardware back).
 * true — оқиға өңделді, жүйелік «шығу» керек емес.
 */
export function resolveAndroidBackNavigation(
  state: NavStateLike | undefined,
  dispatch: AndroidBackDispatch
): boolean {
  if (!state) return false;

  const focusedRoute = state.routes[state.index ?? 0];
  if (focusedRoute?.name === "MoreStack" && nestedStackCanPop(focusedRoute.state)) {
    dispatch(CommonActions.goBack());
    return true;
  }

  return false;
}
