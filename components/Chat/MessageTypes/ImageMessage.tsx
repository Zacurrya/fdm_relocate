import { IMAGE_URL_REGEX } from "@utils/formatters";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MessageBubble from "../MessageBubble";
import { MessageProps } from "./types";

/** Maximum height (in px) before the image is cropped in-bubble. */
const MAX_BUBBLE_IMAGE_HEIGHT = 260;

const ImageMessage = ({
  content,
  timeLabel,
  isMe,
  senderName,
  showSenderName = false,
}: MessageProps) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Find the image URL – matches extensions or the Supabase standard storage path.
  const match = content.match(IMAGE_URL_REGEX);
  const imageUrl = match ? match[0] : content.trim();
  const caption = match ? content.replace(imageUrl, "").trim() : "";

  // Calculate aspect ratio; produce fallback if image doesn't load.
  useEffect(() => {
    if (imageUrl) {
      Image.getSize(
        imageUrl,
        (w, h) => setAspectRatio(w / h),
        () => setAspectRatio(1),
      );
    }
  }, [imageUrl]);

  // Bubble content width = maxBubbleWidth minus horizontal padding (px-1 → 4px each side = 8px)
  const maxBubbleWidth = screenWidth * 0.7;
  const imageWidth = maxBubbleWidth - 8; // subtract px-1 padding on each side

  // Decide whether the image needs to be capped (i.e. is taller than the max)
  const naturalHeight = aspectRatio ? imageWidth / aspectRatio : MAX_BUBBLE_IMAGE_HEIGHT;
  const isTall = naturalHeight > MAX_BUBBLE_IMAGE_HEIGHT;
  const displayHeight = isTall ? MAX_BUBBLE_IMAGE_HEIGHT : naturalHeight;

  // Calculate exact dimensions for the full-screen modal image to fit screen bounds
  const maxModalWidth = screenWidth * 0.92;
  const maxModalHeight = screenHeight * 0.75;
  let modalImageWidth = maxModalWidth;
  let modalImageHeight = maxModalHeight;

  if (aspectRatio) {
    if (maxModalWidth / maxModalHeight > aspectRatio) {
      modalImageHeight = maxModalHeight;
      modalImageWidth = maxModalHeight * aspectRatio;
    } else {
      modalImageWidth = maxModalWidth;
      modalImageHeight = maxModalWidth / aspectRatio;
    }
  }

  const timestampClassName = `text-[10px] mt-1 px-1 ${
    isMe ? "text-fdm-bg/60 text-right" : "text-fdm-fg/40"
  }`;

  return (
    <>
      <MessageBubble isMe={isMe} xPadding={1} topPadding={2} bottomPadding={2}>
        {/* Sender name for other users */}
        {!isMe && showSenderName && senderName ? (
          <Text className="text-fdm-accent/80 text-sm font-semibold mb-1 px-1">
            {senderName}
          </Text>
        ) : null}

        {/* Image container – tappable to open modal when tall */}
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.imagePressable}
        >
          <View
            style={[
              styles.imageContainer,
              { width: imageWidth, height: displayHeight },
            ]}
          >
            {aspectRatio !== null ? (
              <Image
                source={{ uri: imageUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode={isTall ? "cover" : "contain"}
              />
            ) : (
              /* Skeleton placeholder while size is loading */
              <View style={styles.skeleton} />
            )}


          </View>
        </Pressable>

        {caption ? (
          <Text
            className={`mt-2 font-medium px-1.5 ${isMe ? "text-fdm-bg" : "text-fdm-fg"}`}
          >
            {caption}
          </Text>
        ) : null}

        <Text numberOfLines={1} className={timestampClassName}>
          {timeLabel}
        </Text>
      </MessageBubble>

      {/* Full-screen image modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Blurred / dimmed backdrop – tap to close */}
        <Pressable
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        >
          {/* Inner pressable prevents accidental close when tapping the image */}
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalImageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: modalImageWidth,
                height: modalImageHeight,
              }}
              resizeMode="contain"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  imagePressable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  skeleton: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    // React Native doesn't support CSS backdrop-filter, but the dark overlay
    // gives the same dimmed + slightly-blurred visual impression.
  },
  modalImageWrapper: {
    borderRadius: 16,
    overflow: "hidden",
  },
});

export default ImageMessage;
