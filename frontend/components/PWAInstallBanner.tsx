import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Modal, Platform } from "react-native";
import { usePWAInstall } from "../hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, showIOSInstructions, setShowIOSInstructions, installApp } =
    usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== "web" || isInstalled || dismissed || !isInstallable) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom / Top Install Pill Banner */}
      <View className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 border-b border-blue-500/30 px-4 py-2.5 shadow-md">
        <View className="max-w-6xl mx-auto w-full flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-8 h-8 rounded-lg bg-white p-1 mr-3 shadow-sm items-center justify-center">
              <Image
                source={require("../assets/hospital-logo.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-xs sm:text-sm">
                Install CarePulse App
              </Text>
              <Text className="text-blue-100 text-[11px] hidden sm:flex">
                Use directly on your Mobile or PC without browser address bar
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={installApp}
              className="bg-white hover:bg-blue-50 active:bg-blue-100 px-3.5 py-1.5 rounded-lg shadow-sm flex-row items-center"
            >
              <Text className="text-blue-700 font-extrabold text-xs">
                📲 Install App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDismissed(true)}
              className="p-1.5 ml-1 rounded-md hover:bg-blue-500/30 text-white"
            >
              <Text className="text-white text-xs font-bold">✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* iOS Safari Guidance Modal */}
      {showIOSInstructions && (
        <Modal
          transparent
          animationType="fade"
          visible={showIOSInstructions}
          onRequestClose={() => setShowIOSInstructions(false)}
        >
          <View className="flex-1 bg-black/60 items-center justify-center p-4">
            <View className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-2xl bg-blue-50 p-2.5 mb-2 items-center justify-center shadow-sm">
                  <Image
                    source={require("../assets/hospital-logo.png")}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-slate-900 font-extrabold text-lg text-center">
                  Install CarePulse on iOS
                </Text>
                <Text className="text-slate-500 text-xs text-center mt-1">
                  Follow these 2 simple steps in Safari:
                </Text>
              </View>

              <View className="space-y-3 bg-slate-50 p-4 rounded-2xl mb-5">
                <View className="flex-row items-center">
                  <Text className="text-blue-600 font-bold mr-2 text-base">1.</Text>
                  <Text className="text-slate-700 text-xs flex-1">
                    Tap the <Text className="font-bold">Share</Text> icon (⎋) at the bottom of Safari.
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-blue-600 font-bold mr-2 text-base">2.</Text>
                  <Text className="text-slate-700 text-xs flex-1">
                    Scroll down and tap <Text className="font-bold">Add to Home Screen</Text> (➕).
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowIOSInstructions(false)}
                className="w-full bg-blue-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-sm">Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
