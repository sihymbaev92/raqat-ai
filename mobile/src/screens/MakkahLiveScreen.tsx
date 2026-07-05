import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KaabaLivePlayerSurface } from "../components/KaabaLiveModal";
import { useAppTheme } from "../theme/ThemeContext";
import type { MoreStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MoreStackParamList, "MakkahLive">;

/** Flutter MakkahLiveScreen + youtube_player_flutter RN эквиваленті. */
export function MakkahLiveScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  return (
    <KaabaLivePlayerSurface
      visible
      onClose={() => navigation.goBack()}
      colors={colors}
      title="Қағба — тікелей эфир"
      soundOnLabel="Дауысты қосу"
      soundOffLabel="Дауысты өшіру"
      closeLabel="Жабу"
      initialMuted={false}
    />
  );
}
