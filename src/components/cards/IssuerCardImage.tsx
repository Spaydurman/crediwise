import { useState, type ReactNode } from "react";
import { Image, View } from "react-native";

interface IssuerCardImageProps {
  url?: string;
  height: number;
  backgroundColor: string;
  fallback: ReactNode;
}

export function IssuerCardImage({ url, height, backgroundColor, fallback }: IssuerCardImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) return <>{fallback}</>;

  return (
    <View className="items-center justify-center overflow-hidden" style={{ height, backgroundColor }}>
      <Image
        source={{ uri: url }}
        resizeMode="contain"
        style={{ width: "100%", height }}
        onError={() => setFailedUrl(url)}
        accessibilityLabel="Official card product image"
      />
    </View>
  );
}
