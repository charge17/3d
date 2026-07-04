# 🚀 Hunyuan3D v4 ULTRA PRO — Free SaaS (2-Layer)

> **AI-Powered 3D Mesh Generation** · GLB Export · PBR Textures · WebGL Viewer  
> **طبقتين فقط**: Google Colab (GPU Backend) ← Vercel (Frontend)  
> **💰 100% مجاني** — بدون أي خدمات مدفوعة

---

## 🧠 Architecture (نسخة مباشرة — بدون وسيط)

```
┌──────────────────────────────────┐
│         Vercel Frontend          │
│  (Next.js + Three.js WebGL)      │
│  • Prompt Input                  │
│  • 3D Viewer (Orbit + PBR)      │
│  • Gallery / History             │
│  • Download GLB                  │
└──────────────┬───────────────────┘
               │  HTTPS مباشر
               │  (CORS enabled)
               ▼
┌──────────────────────────────────┐
│       Google Colab (GPU)         │
│  (FastAPI + Cloudflare Tunnel)   │
│  • Rate Limiter (15 req/min/IP) │
│  • Memory Cache (1h TTL)        │
│  • Queue System                  │
│  • Hunyuan3D-2 Engine            │
│  • GLB + Thumbnail Generation   │
└──────────────────────────────────┘
```

**ليه حذفنا Cloudflare Worker؟** الـ Colab عنده كل شيء مدمج: Rate Limiter، CORS، Cache. مش محتاجين طبقة إضافية — ده بيقلل التعقيد ونقاط الفشل.

---

## 📁 Project Structure

```
hunyuan3d-v4/
├── colab/
│   └── Hunyuan3D_v4_Ultra_Pro.ipynb   ← الباك-إند (كل شيء في ملف واحد)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              ← Root layout
│   │   │   ├── page.tsx                ← الصفحة الرئيسية (UI كامل)
│   │   │   └── globals.css             ← Tailwind + glass UI
│   │   ├── components/
│   │   │   ├── ModelViewer.tsx         ← Three.js WebGL 3D Viewer
│   │   │   └── Gallery.tsx             ← Gallery + localStorage
│   │   └── lib/
│   │       └── api.ts                  ← API Client (fetch + poll)
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

---

## ⚡ Quick Start (3 خطوات فقط)

### Step 1: شغّل Colab

1. افتح [Google Colab](https://colab.research.google.com/)
2. Upload الملف: `colab/Hunyuan3D_v4_Ultra_Pro.ipynb`
3. من القائمة: **Runtime → Change runtime type → T4 GPU → Save**
4. شغّل الخلايا الثلاث **بالترتيب** (▶️ على كل خلية):
   - **خلية 1**: تثبيت المكتبات (2-3 دقائق)
   - **خلية 2**: تحميل المحرك + API (ثواني)
   - **خلية 3**: تشغيل السيرفر + tunnel (يطلعلك رابط)

5. من مخرجات الخلية الثالثة، انسخ الرابط:

```
============================================================
🔗 PUBLIC API URL:  https://happy-frog-abc123.trycloudflare.com
📖 API Docs:         https://happy-frog-abc123.trycloudflare.com/docs
❤️  Health Check:     https://happy-frog-abc123.trycloudflare.com/health
============================================================
```

> ⚠️ الرابط **يتغير كل مرة** تشغل فيها Colab. ابقَ التبويبة مفتوحة عشان الجلسة ما تنتهيش (90 دقيقة حد أقصى بدون استخدام).

---

### Step 2: انشر Vercel Frontend

```bash
cd frontend
npm install
```

**ارفع على GitHub** ثم انشر على Vercel:

- روح على [vercel.com/new](https://vercel.com/new)
- اختار الـ repo
- أضف Environment Variable:
  - **Name**: `NEXT_PUBLIC_API_URL`
  - **Value**: رابط Colab اللي نسخته (`https://xxx.trycloudflare.com`)
- اضغط **Deploy**

أو من الـ CLI:

```bash
npx vercel --prod
# حين يسألك عن environment variables، أضف NEXT_PUBLIC_API_URL
```

---

### Step 3: استخدم النظام!

افتح رابط Vercel في المتصفح:

```
https://your-project.vercel.app
```

1. اكتب prompt: `a golden crown with jewels`
2. اضغط **Generate**
3. الحالة: pending → processing → done
4. استعرض الموديل في الـ 3D Viewer (لف بالماوس، كبّر، صغّر)
5. اضغط **Download GLB** لتحميل الملف

---

## 🔄 لما Colab يقفل (كل 90 دقيقة)

لما تحتاج تشغل Colab من جديد:

1. افتح الـ notebook في Colab واضغط **Run all**
2. انسخ رابط `trycloudflare.com` الجديد من المخرجات
3. روح على Vercel Dashboard → Settings → Environment Variables
4. حدّث قيمة `NEXT_PUBLIC_API_URL` بالرابط الجديد
5. اضغط **Redeploy**

---

## 🔌 توصيل الموديل الحقيقي (Hunyuan3D-2)

ابحث في الخلية الثانية عن `# 🔌 REAL MODEL HOOK` واستبدله:

```python
from diffusers import Hunyuan3DPipeline
import torch

MODEL = Hunyuan3DPipeline.from_pretrained(
    "tencent/Hunyuan3D-2",
    torch_dtype=torch.float16,
    variant="fp16"
)
MODEL.enable_model_cpu_offload()
MODEL.enable_vae_slicing()

# وفي دالة generate_3d_asset، استبدل الـ placeholder بـ:
mesh = MODEL(
    prompt=enhanced,
    num_inference_steps=40,
    guidance_scale=7.5,
    output_type="mesh",
    generator=torch.Generator("cuda").manual_seed(seed or 42)
).mesh[0]
mesh.export(glb_path, file_type="glb")
```

> ⚠️ الموديل ~5GB. T4 المجاني يكفي. A100 أفضل للجودة العالية.

---

## 📡 API Reference (مباشر من Colab)

جميع الطلبات تذهب مباشرة إلى `https://xxx.trycloudflare.com`.

### `POST /generate`
تقديم مهمة توليد جديدة.

```json
// Request
{ "prompt": "a dragon statue, detailed scales" }

// Response
{ "job_id": "abc12345", "status": "pending", "queue_position": 0 }
```

### `GET /status/:job_id`
فحص حالة المهمة.

```json
{
  "job_id": "abc12345",
  "status": "done",
  "file_id": "abc12345",
  "prompt_original": "a dragon statue...",
  "prompt_enhanced": "a dragon statue..., ultra detailed, ...",
  "file_size_bytes": 32768,
  "completed_at": "2026-07-04T12:00:00Z"
}
```

### `GET /download/:file_id`
تحميل ملف GLB (نوع المحتوى: `model/gltf-binary`).

### `GET /thumbnail/:file_id`
عرض صورة PNG预览.

### `GET /health`
فحص صحة السيرفر.

```json
{
  "status": "healthy",
  "model_loaded": true,
  "queue_size": 0,
  "completed_jobs": 5
}
```

### `GET /stats`
إحصائيات السيرفر.

---

## 🛡️ ميزات الحماية المدمجة (في Colab نفسه)

| الميزة | القيمة | ملاحظة |
|--------|--------|--------|
| Rate Limiting | 15 req/min لكل IP | يحمي من الاستخدام المفرط |
| Prompt max length | 500 حرف | يمنع prompts طويلة جداً |
| Memory Cache | GLB + thumbnails (1 ساعة) | يسرع التحميل المتكرر |
| CORS | مفتوح للكل (`*`) | يسمح لـ Vercel بالاتصال |
| Cache-Control headers | `max-age=3600` | المتصفح يخزن الملفات |

---

## 🎨 وصف الـ Frontend

| المكوّن | التقنية | الوصف |
|---------|---------|--------|
| **Prompt Input** | React state | 8 أمثلة جاهزة، عداد أحرف، Enter للإرسال |
| **3D Viewer** | Three.js + @react-three/fiber | OrbitControls، PBR lighting، shadows، grid، auto-center/scale |
| **Status Tracker** | Polling كل 3 ثواني | شريط حالة: pending → processing → done مع queue position |
| **Gallery** | localStorage | تاريخ دائم، thumbnail، download، delete |
| **UI Style** | Tailwind CSS | Dark theme، glass-morphism، gradient text، animations |

---

## 🚧 حدود النسخة المجانية

| الحد | التفاصيل |
|------|----------|
| Colab GPU | T4 مجاني، 90 دقيقة idle timeout |
| Queue | عامل واحد (job واحد في نفس الوقت) |
| Cache | في الذاكرة فقط (يختفي عند إعادة التشغيل) |
| تخزين الملفات | مؤقت (يختفي عند إغلاق Colab) |
| Rate limit | 15 طلب/دقيقة لكل IP |

---

## 🔄 التوسع إلى Production SaaS

لما تحتاج تخرج من مرحلة الـ prototype:

| الأن | المستقبل |
|------|----------|
| Colab T4 | HuggingFace Spaces / RunPod / Replicate |
| Cloudflare Tunnel | Domain مخصص + HTTPS |
| ذاكرة مؤقتة | Cloudflare R2 أو Backblaze B2 |
| Rate limiter بسيط | Cloudflare Rate Limiting أو Upstash |
| بدون Auth | Clerk / NextAuth |
| مستخدم واحد | Queue متعدد + multiple GPUs |
| بدون دفع | Stripe integration |

---

## ❓ أسئلة شائعة

**Q: ليه الرابط بتاعي بيغير كل مرة؟**  
A: Cloudflare Tunnel يعطي subdomain عشوائي مؤقت. للحل الدائم: استخدم HuggingFace Spaces أو RunPod.

**Q: هل أقدر أستخدم الموديل الحقيقي؟**  
A: نعم، استبدل كود الـ placeholder بكود Hunyuan3D-2 pipeline (موجود في قسم 🔌 أعلاه). الموديل الرسمي لما ينزل، الكود جاهز.

**Q: الموقع بطيء ليه؟**  
A: Colab T4 GPU يعالج job واحد في كل مرة. لو في queue، الجيل يستنى. وقت الجيل: 30-120 ثانية حسب التعقيد.

**Q: هل فيه طريقة أخلي Colab ما يقفلش؟**  
A: استخدم extension "Colab Keep Alive" أو افتح الـ `/health` endpoint كل 10 دقائق بـ cron job.

---

## 📜 License

MIT — Free for personal and commercial use.

---

Built with ❤️ for the 3D community.
