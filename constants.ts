
import { AspectRatio, ImageQuality } from "./types";

// App này giờ chuyên dụng cho Shop Quần Áo
export const APP_NAME = "AI Fashion Studio";
export const APP_DESCRIPTION = "Chuyên tách quần áo, set bộ, váy đầm khỏi người mẫu cho Shop Online";

export const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: "1:1", label: "Vuông (Instagram/Shopee)", icon: "aspect-square" },
  { value: "3:4", label: "Dọc (Facebook/Web)", icon: "aspect-[3/4]" },
  { value: "9:16", label: "Story (TikTok/Reels)", icon: "aspect-[9/16]" },
  { value: "16:9", label: "Ngang (Youtube/Banner)", icon: "aspect-video" },
];

export const QUALITY_OPTIONS: { value: ImageQuality; label: string; desc: string; pro?: boolean }[] = [
  { value: ImageQuality.STANDARD, label: "Tiêu chuẩn", desc: "Tốc độ nhanh" },
  { value: ImageQuality.HD, label: "HD (2K)", desc: "Chi tiết vải rõ nét", pro: true },
  { value: ImageQuality.UHD, label: "Ultra HD (4K)", desc: "In ấn sắc nét", pro: true },
];

// --- CÁC TÙY CHỌN MỚI CHO PROMPT BUILDER ---

export const FASHION_STYLES = [
  { value: "", label: "-- Chọn Phong Cách --" },
  { value: "Traditional Vietnamese Ao Dai, Tet Holiday vibe", label: "🧧 Áo Dài / Tết Truyền Thống" },
  { value: "Modest, Elegant, Temple visit style", label: "🙏 Đi Lễ Chùa (Trang Nhã)" },
  { value: "Festive, Spring Flower Festival, Bright colors", label: "🌸 Lễ Hội / Du Xuân" },
  { value: "Minimalist, Clean, High-end fashion", label: "Tối giản & Sang trọng (Minimalist)" },
  { value: "Vintage, Retro 90s aesthetic", label: "Cổ điển (Vintage/Retro)" },
  { value: "Streetwear, Urban, Edgy", label: "Đường phố (Streetwear)" },
  { value: "Bohemian, Natural, Free-spirit", label: "Du mục (Bohemian)" },
  { value: "Office wear, Professional, Elegant", label: "Công sở (Office)" },
  { value: "Cyberpunk, Neon, Futuristic", label: "Tương lai (Cyberpunk)" },
  { value: "Soft pastel, Dreamy, Romantic", label: "Nàng thơ (Romantic)" },
  { value: "Y2K, Colorful, Playful", label: "Y2K Cá tính" },
];

export const POSES = [
  { value: "", label: "-- Chọn Tư Thế (Vibe chung) --" },
  { value: "Holding a traditional paper fan, elegant", label: "Cầm quạt giấy / Phong bao lì xì" },
  { value: "Praying pose, hands together, respectful", label: "Chắp tay cầu nguyện (Đi chùa)" },
  { value: "Walking confidently towards camera", label: "Đi bộ tự tin về phía trước" },
  { value: "Standing still, hands in pockets", label: "Đứng yên, tay đút túi" },
  { value: "Sitting elegantly on a chair", label: "Ngồi ghế thanh lịch" },
  { value: "Leaning against a wall, relaxed", label: "Dựa tường thư giãn" },
  { value: "Dynamic movement, dancing pose", label: "Chuyển động/Nhảy múa" },
  { value: "Close-up portrait, looking at camera", label: "Cận cảnh chân dung" },
  { value: "Side profile view", label: "Góc nghiêng thần thánh" },
];

export const BACKGROUNDS = [
  { value: "", label: "-- Chọn Bối Cảnh (Cố định 4 ảnh) --" },
  { value: "Ancient Asian Pagoda Architecture, Peaceful, Incense smoke", label: "⛩️ Chùa Cổ Kính / Tâm Linh" },
  { value: "Tet Flower Market, Peach Blossoms, Ochna, Crowded", label: "🌺 Chợ Hoa Tết (Đào/Mai)" },
  { value: "Hoi An Ancient Town, Lanterns, Yellow walls", label: "🏮 Phố Cổ / Đèn Lồng Hội An" },
  { value: "Red Festive Background, Lucky symbols, Gold accents", label: "🔴 Phông Đỏ May Mắn (Studio Tết)" },
  { value: "Professional Studio, Plain White/Grey Background", label: "Studio (Trắng/Xám)" },
  { value: "Parisian Street, Sunlight, Bokeh", label: "Đường phố Châu Âu" },
  { value: "Luxury Modern Living Room", label: "Phòng khách sang trọng" },
  { value: "Tropical Beach, Blue Sky", label: "Bãi biển nhiệt đới" },
  { value: "Urban City Rooftop at Sunset", label: "Sân thượng thành phố" },
  { value: "Minimalist Architectural Concrete Wall", label: "Tường bê tông tối giản" },
  { value: "Lush Green Garden, Flowers", label: "Sân vườn nhiều cây" },
  { value: "Coffee Shop, Cozy, Warm", label: "Quán Cafe ấm cúng" },
];

export const ANGLES = [
  { value: "", label: "-- Chọn Góc Máy --" },
  { value: "Eye-level shot", label: "Ngang tầm mắt (Chuẩn)" },
  { value: "Low angle shot, empowering", label: "Góc thấp (Hack dáng chân dài)" },
  { value: "High angle shot", label: "Góc cao (Chụp xuống)" },
  { value: "Macro close-up on fabric details", label: "Cận cảnh chi tiết vải" },
  { value: "Wide angle full body shot", label: "Góc rộng toàn thân" },
];

// --- MỚI: TÙY CHỌN NÂNG CAO ---

export const LIGHTING_OPTIONS = [
  { value: "", label: "-- Chọn Ánh Sáng --" },
  { value: "Softbox Studio Lighting, Evenly lit", label: "Ánh sáng Studio (Mịn)" },
  { value: "Natural Golden Hour Sunlight", label: "Nắng vàng (Golden Hour)" },
  { value: "Warm Lantern Light, Cozy", label: "Ánh đèn vàng ấm áp (Lễ hội)" },
  { value: "Cinematic Dramatic Shadows", label: "Điện ảnh (Tương phản cao)" },
  { value: "Overcast Soft Light", label: "Ánh sáng trời râm (Dịu nhẹ)" },
];

export const MODEL_TYPES = [
  { value: "", label: "-- Chọn Người Mẫu --" },
  { value: "Vietnamese Asian Female Model", label: "Nữ Châu Á (Việt Nam)" },
  { value: "Korean Style Female Model", label: "Nữ Hàn Quốc" },
  { value: "Western Caucasian Female Model", label: "Nữ Tây Âu" },
  { value: "Vietnamese Asian Male Model", label: "Nam Châu Á (Việt Nam)" },
  { value: "Western Male Model", label: "Nam Tây Âu" },
];

export const HAIRSTYLES = [
  { value: "", label: "-- Chọn Kiểu Tóc (Đồng nhất) --" },
  { value: "Long straight dark hair, sleek", label: "Tóc dài thẳng (Suôn mượt)" },
  { value: "Wavy voluminous hair, romantic", label: "Tóc xoăn sóng (Bồng bềnh)" },
  { value: "High sleek ponytail", label: "Tóc đuôi ngựa cao (Cá tính)" },
  { value: "Short Bob cut, modern", label: "Tóc ngắn Bob (Hiện đại)" },
  { value: "Elegant Low Bun, chic", label: "Búi thấp (Sang trọng)" },
  { value: "Messy Bun, casual", label: "Búi rối (Tự nhiên)" },
  { value: "Braided hair, boho style", label: "Tóc tết (Nữ tính)" },
  { value: "Shoulder length hair with bangs", label: "Tóc ngang vai mái thưa" },
];

export const TIME_OPTIONS = [
  { value: "", label: "-- Thời Gian/Mùa --" },
  { value: "Lunar New Year Spring, Festive atmosphere", label: "🐲 Dịp Tết Nguyên Đán" },
  { value: "Bright Summer Day", label: "Mùa Hè rực rỡ" },
  { value: "Cozy Autumn Vibe", label: "Mùa Thu lãng mạn" },
  { value: "Winter Cold Fashion", label: "Mùa Đông ấm áp" },
  { value: "Spring Freshness", label: "Mùa Xuân tươi mới" },
  { value: "Night Time City Lights", label: "Ban đêm (City Lights)" },
];

// --- CONFIG VARIATIONS ---

export const VARIATION_CONFIGS = {
  // Config mới: 1 Bối cảnh nhưng 4 dáng Pose khác nhau
  // QUAN TRỌNG: Tất cả đều phải là FULL BODY (Toàn thân)
  POSE_VARIATIONS: [
    {
      label: "Trực Diện (Toàn Thân)",
      description: "Góc chính diện từ đầu đến chân, thấy rõ giày.",
      instruction: "POSE VARIATION 1: WIDE ANGLE FULL BODY FRONT VIEW. Camera distance far enough to show head to toe. Model standing confident. Show full outfit and shoes. NO CROPPING."
    },
    {
      label: "Góc Nghiêng (Toàn Thân)",
      description: "Góc nghiêng 3/4 toàn thân, tôn dáng.",
      instruction: "POSE VARIATION 2: WIDE ANGLE FULL BODY SIDE PROFILE. Model turning 3/4 or side. Capture full silhouette from head to heels. Show footwear clearly."
    },
    {
      label: "Bước Đi (Toàn Thân)",
      description: "Dáng bước đi năng động, tà áo bay, thấy chân.",
      instruction: "POSE VARIATION 3: WIDE ANGLE FULL BODY WALKING. Dynamic movement. Show legs and shoes clearly. Fabric flowing. Camera zooms out to capture full height."
    },
    {
      label: "Phía Sau/Phá Cách (Toàn Thân)",
      description: "Góc nhìn từ phía sau hoặc tạo dáng nghệ thuật toàn thân.",
      instruction: "POSE VARIATION 4: WIDE ANGLE FULL BODY REAR VIEW or CREATIVE POSE. Model looking back over shoulder. Show details of the back of the outfit and full length including shoes."
    }
  ]
};
