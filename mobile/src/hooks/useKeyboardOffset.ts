import { useEffect, useState } from "react";
import { Keyboard, type KeyboardEvent, Platform } from "react-native";

/**
 * Ашық клавиатураның биіктігі (px). Жазу жолын клавиатура үстіне көтеру үшін
 * paddingBottom / margin ретінде қолданылады — әсіресе Android-да KeyboardAvoidingView жеткізбеген кезде.
 */
export function useKeyboardOffset(): number {
  const [h, setH] = useState(0);
  useEffect(() => {
    const showEv = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEv = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = (e: KeyboardEvent) => setH(e.endCoordinates.height);
    const onHide = () => setH(0);
    const subShow = Keyboard.addListener(showEv, onShow);
    const subHide = Keyboard.addListener(hideEv, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);
  return h;
}
