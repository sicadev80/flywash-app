import { supabase } from "../lib/supabase";
import type { Product } from "../types/product";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("nom", { ascending: true });

  if (error) {
    console.error("Erreur Supabase getProducts:", error);
    return [];
  }

  return (data as Product[]) ?? [];
}
