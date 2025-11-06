import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Input,
  Button,
  Spinner,
  Alert,
} from "@material-tailwind/react";
import api from "@/configs/api";
import { useForm } from "react-hook-form";

export default function GenerateCertificate() {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      studentName: "",
      courseName: "",
      trainerName: "",
    },
    mode: "onSubmit",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const onSubmit = async (values) => {
    setError("");

    setSubmitting(true);
    try {
      const { data } = await api.post("/certificates/generate-fixed", {
        traineeName: values.studentName.trim(),
        courseName: values.courseName.trim(),
        trainerName: values.trainerName.trim(),
        // certificateNumber, issueDate optional by backend if omitted
      });

      const normalized = {
        success: data.message ? true : (data.success ?? true),
        certificateNumber: data.certificateNumber,
        issueDate: data.issueDate,
        pdfUrl: data.pdfUrl,
        verifyUrl:
          data.verificationUrl || data.verifyUrl ||
          (data.certificateNumber ? `https://desn.pro/verify?certificate=${data.certificateNumber}` : undefined),
      };
      setResult(normalized);
      if (normalized.pdfUrl) {
        try { window.open(normalized.pdfUrl, "_blank"); } catch (_) {}
      }
    } catch (err) {
      const message = err.response
        ? (err.response.data?.message || err.response.data?.error || "خطأ من الخادم")
        : (err.request ? "تعذر الاتصال بالخادم، تحقق من الشبكة أو CORS" : (err.message || "تعذر إنشاء الشهادة"));
      setError(message);
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    reset();
    setResult(null);
    setError("");
  };

  return (
    <>
      <div className="relative mt-8 h-72 w-full rounded-xl bg-cover bg-center bg-[url('/img/background-image.png')]">
        <div className="absolute inset-0 bg-gray-900/75" />
      </div>

      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100 shadow-lg">
        <CardHeader floated={false} shadow={false} className="p-6 text-right">
          <div className="flex items-center justify-between">
            <Typography variant="h2" className="font-arabic">
              مولد الشهادات
            </Typography>
            {result && (
              <Button color="red" variant="outlined" onClick={resetAll} className="font-arabic">
                بدء عملية جديدة
              </Button>
            )}
          </div>
          <Typography variant="small" className="text-blue-gray-600 font-arabic mt-2">
            أدخل بيانات الشهادة ثم اضغط إنشاء
          </Typography>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {error && (
            <Alert color="red" className="font-arabic">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="اسم المتدرب"
                className="font-arabic"
                {...register("studentName", { required: true, minLength: 2 })}
              />
              {errors.studentName && (
                <span className="text-red-600 text-sm font-arabic">هذا الحقل مطلوب</span>
              )}
            </div>
            
            
            <div>
              <Input
                label="اسم الدورة التعليمية"
                className="font-arabic"
                {...register("courseName", { required: true, minLength: 2 })}
              />
              {errors.courseName && (
                <span className="text-red-600 text-sm font-arabic">هذا الحقل مطلوب</span>
              )}
            </div>
            <div>
              <Input
                label="اسم المدرب"
                className="font-arabic"
                {...register("trainerName", { required: true, minLength: 2 })}
              />
              {errors.trainerName && (
                <span className="text-red-600 text-sm font-arabic">هذا الحقل مطلوب</span>
              )}
            </div>
            

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" color="blue" className="min-w-[180px] font-arabic" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2"><Spinner className="h-4 w-4" /> جارٍ الإنشاء…</span>
                ) : (
                  "إنشاء الشهادة"
                )}
              </Button>
            </div>
          </form>

          {result && result.certificateNumber && (
            <div className="mt-2 border border-blue-gray-100 rounded-xl p-4 bg-blue-gray-50/30">
              <Typography variant="h5" className="font-arabic mb-4 text-right">
                تم إنشاء الشهادة بنجاح
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                <div className="space-y-1">
                  <div className="text-blue-gray-600 font-arabic">رقم الشهادة</div>
                  <div className="font-bold text-blue-900">{result.certificateNumber}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-blue-gray-600 font-arabic">تاريخ الإصدار</div>
                  <div className="font-bold text-blue-900">{result.issueDate || new Date().toLocaleDateString("ar-EG")}</div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-blue-gray-600 font-arabic">رابط التحقق</div>
                  <a
                    href={result.verifyUrl || `https://desn.pro/verify?certificate=${result.certificateNumber}`}
                    className="text-blue-600 underline break-all"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.verifyUrl || `https://desn.pro/verify?certificate=${result.certificateNumber}`}
                  </a>
                </div>
              </div>

              {result.pdfUrl && (
                <div className="mt-6 flex justify-end">
                  <Button color="green" onClick={() => window.open(result.pdfUrl, "_blank")} className="font-arabic min-w-[180px]">
                    تنزيل الشهادة PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}


