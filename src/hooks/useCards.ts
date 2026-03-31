import { useEffect } from "react";
import { useCardsStore } from "../stores/cards.store";

export function useCards() {
  const {
    cards,
    loading,
    error,
    fetchCards,
    addCard,
    updateCard,
    deleteCard,
  } = useCardsStore();

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    addCard,
    updateCard,
    deleteCard,
    refetch: fetchCards,
  };
}
