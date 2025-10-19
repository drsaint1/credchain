import { SkillCategory } from "../config/programs";


export function extractSkillCategory(badgeAccount: any): SkillCategory | null {
  
  const skillCategoryField =
    badgeAccount.skillCategory || badgeAccount.skill_category;

  if (!skillCategoryField) {
    console.error("No skill category found in badge account:", badgeAccount);
    return null;
  }

  const categoryKey = Object.keys(skillCategoryField)[0];

  
  const categoryMap: Record<string, SkillCategory> = {
    solanaDeveloper: SkillCategory.SolanaDeveloper,
    uiUxDesigner: SkillCategory.UIUXDesigner,
    contentWriter: SkillCategory.ContentWriter,
    dataAnalyst: SkillCategory.DataAnalyst,
    marketingSpecialist: SkillCategory.MarketingSpecialist,
    frontendDeveloper: SkillCategory.FrontendDeveloper,
  };

  const category = categoryMap[categoryKey];

  if (!category) {
    console.error("Unknown category key:", categoryKey);
    return null;
  }

  return category;
}