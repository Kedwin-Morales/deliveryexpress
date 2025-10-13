import { images } from "@/constants";
import { useState, useRef, useEffect } from "react";
import { View, ScrollView, Image, Text, StyleSheet, LayoutChangeEvent } from "react-native";

const imagesCarrusel = [
  images.banner_1,
  images.banner_2,
  images.banner_3,
];

export default function Carrusel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activeIndex) setActiveIndex(slide);
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  // 🕒 Carrusel automático (rebote)
  useEffect(() => {
    if (dimensions.width === 0) return; // no inicies hasta tener medidas

    const interval = setInterval(() => {
      let nextIndex = activeIndex;

      if (direction === "forward") {
        nextIndex = activeIndex + 1;
        if (nextIndex >= imagesCarrusel.length - 1) {
          nextIndex = imagesCarrusel.length - 1;
          setDirection("backward");
        }
      } else {
        nextIndex = activeIndex - 1;
        if (nextIndex <= 0) {
          nextIndex = 0;
          setDirection("forward");
        }
      }

      scrollRef.current?.scrollTo({
        x: nextIndex * dimensions.width,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, direction, dimensions]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {dimensions.width > 0 && (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {imagesCarrusel.map((img, index) => (
              <Image
                key={index}
                source={typeof img === 'string' ? { uri: img } : img}
                style={{
                  width: dimensions.width,
                  height: dimensions.height || 220,
                  borderRadius: 12,
                }}
                resizeMode="contain"
              />
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {imagesCarrusel.map((_, index) => (
              <Text
                key={index}
                style={index === activeIndex ? styles.activeDot : styles.dot}
              >
                ●
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  dot: {
    color: "#bbb",
    fontSize: 18,
    marginHorizontal: 3,
  },
  activeDot: {
    color: "#003399",
    fontSize: 20,
    marginHorizontal: 3,
  },
});
