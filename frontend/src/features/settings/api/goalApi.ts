import { apiClient } from "@/lib/axios";
import type { NutritionGoals } from "@/types/settings";

export const goalApi = {
  getGoals: async (): Promise<NutritionGoals> => {
    const response = await apiClient.get("/goals/");
    return response.data;
  },

  updateGoals: async (goals: NutritionGoals): Promise<NutritionGoals> => {
    const response = await apiClient.put("/goals/", goals);
    return response.data;
  },
};
