import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  PHILIPPINE_BANKS,
  getPhilippineBank,
  type PhilippineBank,
} from "../../constants/philippineBanks";

interface BankSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function BankLogo({ bank, size = 36 }: { bank: PhilippineBank; size?: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <View
        className="items-center justify-center rounded-lg"
        style={{ width: size, height: size, backgroundColor: bank.brandColor }}
      >
        <Text className="text-white text-[10px] font-bold" numberOfLines={1}>
          {bank.shortName}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="items-center justify-center rounded-lg bg-white border border-slate-200 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        source={{
          uri: `https://www.google.com/s2/favicons?domain=${bank.domain}&sz=128`,
        }}
        style={{ width: size - 10, height: size - 10 }}
        resizeMode="contain"
        onError={() => setImageFailed(true)}
      />
    </View>
  );
}

export function BankSelect({ value, onChange, error }: BankSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const selectedBank = getPhilippineBank(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return PHILIPPINE_BANKS;

    return PHILIPPINE_BANKS.filter(
      (bank) =>
        bank.name.toLocaleLowerCase().includes(normalized) ||
        bank.shortName.toLocaleLowerCase().includes(normalized),
    );
  }, [query]);

  const selectBank = (bank: PhilippineBank) => {
    setQuery(bank.name);
    onChange(bank.name);
    setOpen(false);
  };

  return (
    <View className="gap-1.5">
      <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">
        Bank
      </Text>

      <View
        className={`flex-row items-center bg-white dark:bg-slate-800 border rounded-xl px-4 ${
          error ? "border-red-500" : open ? "border-indigo-500" : "border-slate-300 dark:border-slate-700"
        }`}
      >
        <TextInput
          className="flex-1 py-3.5 pr-3 text-slate-950 dark:text-white text-base"
          placeholder="Search a Philippine bank"
          placeholderTextColor="#94a3b8"
          value={query}
          onFocus={() => setOpen(true)}
          onChangeText={(text) => {
            setQuery(text);
            onChange(text);
            setOpen(true);
          }}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {selectedBank ? (
          <BankLogo bank={selectedBank} />
        ) : (
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={20}
            color="#94a3b8"
          />
        )}
      </View>

      {open && (
        <View className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <ScrollView
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {matches.length > 0 ? (
              matches.map((bank, index) => (
                <Pressable
                  key={bank.id}
                  onPress={() => selectBank(bank)}
                  className={`flex-row items-center px-3 py-2.5 active:bg-slate-100 dark:active:bg-slate-700 ${
                    index < matches.length - 1
                      ? "border-b border-slate-100 dark:border-slate-700"
                      : ""
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-slate-950 dark:text-white text-sm font-semibold">
                      {bank.name}
                    </Text>
                    {bank.shortName !== bank.name && (
                      <Text className="text-slate-500 text-xs">{bank.shortName}</Text>
                    )}
                  </View>
                  <BankLogo bank={bank} size={34} />
                </Pressable>
              ))
            ) : (
              <View className="px-4 py-5 items-center">
                <Text className="text-slate-500 text-sm">
                  No matching Philippine bank
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {error && <Text className="text-red-500 dark:text-red-400 text-xs">{error}</Text>}
      {!error && (
        <Text className="text-slate-500 text-xs">
          Card name will use the selected bank.
        </Text>
      )}
    </View>
  );
}
