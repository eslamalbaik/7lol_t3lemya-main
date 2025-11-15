import React, { useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Typography,
  Button,
  Input,
  Avatar,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  IconButton,
} from "@material-tailwind/react";
import {
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import api from "@/configs/api";

export default function StudentsInterface() {
  const [studentId, setStudentId] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [viewMode, setViewMode] = useState("cards");
  const [openDisclaimer, setOpenDisclaimer] = useState(false);
  const [selectedAction, setSelectedAction] = useState({ type: "", url: "" });
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  function resolveCertificateUrl(cert) {
    // يختار رابط الشهادة من الحقول المتاحة (Cloudinary)
    return (
      cert?.pdfUrl ||
      cert?.certificateUrl ||
      cert?.url ||
      ""
    );
  }
  const handleSearch = async () => {
    const idTrim = studentId.trim();
    if (!idTrim) return;

    setHasSearched(true);
    setIsLoading(true);
    setCertificates([]);

    try {
      // تحقق من الشهادة عبر رقم الشهادة
      const { data } = await api.get("/certificates/verify", {
        params: { certificate: idTrim },
      });
      if (data?.valid && data?.certificate) {
        setCertificates([data.certificate]);
      } else {
        setCertificates([]);
      }
    } catch (err) {
      console.error("Error verifying certificate:", err);
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  function getDownloadUrl(certificateUrl) {
    if (!certificateUrl) return "";
    // إدراج fl_attachment لرابط Cloudinary فقط
    return certificateUrl.includes("/upload/")
      ? certificateUrl.replace("/upload/", "/upload/fl_attachment/")
      : certificateUrl;
  }

function triggerDownload(certificateUrl, filename = "certificate.pdf") {
  const finalUrl = getDownloadUrl(certificateUrl);
  if (!finalUrl) return;
  const link = document.createElement("a");
  link.href = finalUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

  const handleCertificateAction = (type, url) => {
    if (!url) return;
    setSelectedAction({ type, url });
    setOpenDisclaimer(true);
  };

  const statusCard = useMemo(() => {
    if (!hasSearched) return null;
    if (isLoading) {
      return (
        <Card className="mb-4 border border-blue-200 bg-blue-50/70">
          <CardBody className="flex items-center justify-between gap-4 font-arabic">
            <Typography className="text-blue-700" style={{ fontWeight: 500, fontStyle: 'normal' }}>جاري التحقق من الشهادة...</Typography>
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </CardBody>
        </Card>
      );
    }

    if (certificates.length === 1) {
      const cert = certificates[0];
      return (
        <Card className="mb-4 border border-green-200 bg-green-50/70 shadow-sm">
          <CardBody className="grid gap-3 md:grid-cols-4 font-arabic text-right">
            <div className="md:col-span-4 flex flex-col items-center gap-2 text-center">
              <img
                src="/img/ver12.webp"
                alt="تم التحقق"
                className="w-16 h-16"
              />
              <Typography
                variant="h4"
                className="text-green-700 my-2"
                style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                تم التحقق من الشهادة بنجاح
              </Typography>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-green-100">
              <Typography color="gray" className="text-sm"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                رقم الشهادة
              </Typography>
              <Typography className="font-semibold text-blue-gray-900"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                {cert.certificateNumber || studentId}
              </Typography>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-green-100"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
            >
              <Typography color="gray" className="text-sm"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                اسم المتدرب
              </Typography>
              <Typography className="font-semibold text-blue-gray-900"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                {cert.studentName || cert.traineeName || "—"}
              </Typography>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-green-100">
              <Typography color="gray" className="text-sm"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                اسم الدورة
              </Typography>
              <Typography className="font-semibold text-blue-gray-900"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                {cert.courseName || "—"}
              </Typography>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-green-100">
              <Typography color="gray" className="text-sm"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                اسم المدرب
              </Typography>
              <Typography className="font-semibold text-blue-gray-900"                 style={{ fontFamily: '"Readex Pro", sans-serif', fontWeight: 500, fontStyle: 'normal' }}
              >
                {cert.trainerName || "—"}
              </Typography>
            </div>
          </CardBody>
        </Card>
      );
    }

    if (certificates.length === 0 && studentId.trim()) {
      return (
        <Card className="mb-4 border border-red-200 bg-red-50/70">
          <CardBody className="font-arabic text-right text-red-600" style={{ fontWeight: 500, fontStyle: 'normal' }}>
            لم يتم العثور على شهادة بهذا الرقم. تأكد من صحة الرقم وحاول مرة أخرى.
          </CardBody>
        </Card>
      );
    }

    return null;
  }, [hasSearched, isLoading, certificates, studentId]);

  const proceedWithAction = () => {
    if (!selectedAction.url) {
      setOpenDisclaimer(false);
      return;
    }
    window.open(selectedAction.url, "_blank");
    setOpenDisclaimer(false);
  };

  return (
    <>
      {/* Header with Logo & Title */}
      <div className="relative h-72 w-full n rounded-xl bg-cover bg-center mt-48">
        <div className="absolute inset-0 bg-white-900/75" />
        <div className="absolute inset-0 mb-32 flex flex-col justify-center items-center text-center p-4">
          <img src="/img/logopro.jpg" alt="Logo" />
          <Typography variant="h5" className="mt-4 text-white font-arabic" style={{ fontWeight: 500, fontStyle: 'normal' }}>
            المصمم المحترف
          </Typography>
        </div>
      </div>

      {/* Search Interface */}
      <Card className="mx-4 -mt-20 mb-8 border border-blue-gray-100 shadow min-h-[600px]">
        <CardHeader className="p-6 text-right">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Avatar src="/img/certificate.png" size="xl" variant="rounded" />
              <div>
                <Typography variant="h2" className="font-arabic text-[#1C1CB0]" style={{ fontWeight: 500, fontStyle: 'normal' }}>
                  منصة استلام الشهادات
                </Typography>
                <Typography
                  variant="small"
                  className="text-blue-gray-300 font-arabic"
                  style={{ fontWeight: 500, fontStyle: 'normal' }}
                >
                  ابحث عن شهادتك باستخدام رقم الشهادة
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-col md:flex-row">
              <Input
                label="ادخل رقم الشهادة هنا"
                value={studentId}
                onChange={(e) => {
                          setStudentId(e.target.value);
                        }}
                className="font-arabic"
              />
              <Button
                onClick={handleSearch}
                className="font-arabic min-w-[140px] px-4 py-2 bg-[#1C1CB0] text-white flex items-center justify-center gap-2"
                style={{ fontWeight: 500, fontStyle: 'normal' }}
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                بحث
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* <Typography className="font-arabic text-center text-red-500 mt-8 text-lg font-bold">
          الاحتفاظ بالشهادة مسئولية المتدرب ولا يوجد لدينا ارشيف.
        </Typography> */}

        <CardBody className="p-6">
          {statusCard}

          {/* تبديل العرض عند وجود نتائج متعددة (احتياطيًا) */}
          {certificates.length > 1 && (
            <div className="flex items-center justify-end mb-4 space-x-2">
              <Button
                size="sm"
                className={`font-arabic ${
                  viewMode === "cards"
                    ? "bg-[##1C1CB0] text-white"
                    : "bg-gray-400"
                }`}
                onClick={() => setViewMode("cards")}
                style={{ fontWeight: 500, fontStyle: 'normal' }}
              >
                عرض بطاقات
              </Button>
              <Button
                size="sm"
                className={`font-arabic ${
                  viewMode === "table"
                    ? "bg-[##1C1CB0] text-white"
                    : "bg-gray-400"
                }`}
                onClick={() => setViewMode("table")}
                style={{ fontWeight: 500, fontStyle: 'normal' }}
              >
                عرض جدول
              </Button>
            </div>
          )}

          {/* Prompt / No results */}
          {!hasSearched && (
            <Typography className="font-arabic text-center text-gray-500" style={{ fontWeight: 500, fontStyle: 'normal' }}>
              أدخل رقم الشهادة للبدء في التحقق.
            </Typography>
          )}

          {/* Cards View */}
          {certificates.length > 0 && viewMode === "cards" && (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
             {certificates.map((cert, idx) => (
                <Card key={cert._id || idx} className="hover:shadow-lg transition-shadow">
                  <CardBody className="flex flex-col items-stretch p-5 gap-4">
                    <div className="flex justify-between items-start">
                      <Typography variant="small" className="text-gray-500 font-arabic" style={{ fontWeight: 500, fontStyle: 'normal' }}>
                        {cert.createdAt
                          ? new Date(cert.createdAt).toLocaleDateString("ar-EG")
                          : "—"}
                      </Typography>
                      <Typography
                        variant="small"
                        className="bg-blue-100 text-[##1C1CB0] px-2 py-1 rounded-full"
                        style={{ fontWeight: 500, fontStyle: 'normal' }}
                      >
                        شهادة #{idx + 1}
                      </Typography>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <DocumentTextIcon className="h-14 w-14 text-blue-500" />
                      <Typography variant="h6" className="font-arabic text-blue-gray-900" style={{ fontWeight: 500, fontStyle: 'normal' }}>
                        {cert.studentName || cert.traineeName || "—"}
                      </Typography>
                    </div>
                    <div className="bg-blue-gray-50/60 border border-blue-gray-100 rounded-xl p-4 text-right font-arabic" style={{ fontWeight: 500, fontStyle: 'normal' }}>
                      <div className="text-sm text-blue-gray-600" style={{ fontWeight: 500 }}>اسم الدورة</div>
                      <div className="font-semibold text-blue-gray-900" style={{ fontWeight: 500 }}>
                        {cert.courseName || "—"}
                      </div>
                      {cert.trainerName && (
                        <div className="mt-3">
                          <div className="text-sm text-blue-gray-600" style={{ fontWeight: 500 }}>اسم المدرب</div>
                          <div className="font-semibold text-blue-gray-900" style={{ fontWeight: 500 }}>
                            {cert.trainerName}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-4 w-full mt-auto">
                      <IconButton
                        color="blue"
                        variant="text"
                        onClick={() =>
                          handleCertificateAction("view", resolveCertificateUrl(cert))
                        }
                      >
                        <EyeIcon className="h-5 w-5" />
                      </IconButton>

                      <IconButton
                        color="green"
                        variant="text"
                        onClick={() =>
                          triggerDownload(
                            resolveCertificateUrl(cert),
                            `certificate-${cert.certificateNumber || idx + 1}.pdf`
                          )
                        }
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </CardBody>
                </Card>
              ))}

            </div>
          )}

          {/* Table View */}
          {certificates.length > 0 && viewMode === "table" && (
            <table className="min-w-full table-auto text-right font-arabic" style={{ fontWeight: 500, fontStyle: 'normal' }}>
              <thead>
                <tr>
                  <th className="px-4 py-2" style={{ fontWeight: 500, fontStyle: 'normal' }}>الشهادة</th>
                  <th className="px-4 py-2" style={{ fontWeight: 500, fontStyle: 'normal' }}>التاريخ</th>
                  <th className="px-4 py-2" style={{ fontWeight: 500, fontStyle: 'normal' }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert, idx) => (
                  <tr key={cert._id} className="border-t">
                    <td className="px-4 py-2 font-arabic" style={{ fontWeight: 500, fontStyle: 'normal' }}>شهادة {idx + 1}</td>
                    <td className="px-4 py-2" style={{ fontWeight: 500, fontStyle: 'normal' }}>
                      {new Date(cert.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center space-x-4">
                        <IconButton
                          onClick={() =>
                            handleCertificateAction("view", resolveCertificateUrl(cert))
                          }
                          className="h-6 w-6 text-blue-gray-500 hover:text-blue-700 bg-white"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </IconButton>
                        <IconButton
                          onClick={() =>
                            triggerDownload(
                              resolveCertificateUrl(cert),
                              `certificate-${cert.certificateNumber || idx + 1}.pdf`
                            )
                          }
                          className="h-6 w-6 text-green-500 hover:text-green-700 bg-white"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Disclaimer Dialog */}
      <Dialog open={openDisclaimer} handler={() => setOpenDisclaimer(false)}>
        <DialogHeader className="font-arabic" style={{ fontWeight: 500, fontStyle: 'normal' }}>تنبيه هام</DialogHeader>
        <DialogBody divider className="font-arabic text-right" style={{ fontWeight: 500, fontStyle: 'normal' }}>
          <Typography variant="h5" className="text-red-500 mb-4" style={{ fontWeight: 500, fontStyle: 'normal' }}>
            الاحتفاظ بالشهادة مسئولية المتدرب
          </Typography>
          <Typography variant="paragraph" style={{ fontWeight: 500, fontStyle: 'normal' }}>
            يرجى العلم أنه لا يوجد لدينا أرشيف للشهادات، وعليك تحميل وحفظ جميع
            الشهادات الخاصة بك. لن نكون مسؤولين عن أي شهادات مفقودة في حالة عدم
            قيامك بحفظها.
          </Typography>
        </DialogBody>
        <DialogFooter>
            <Button
              variant="text"
              onClick={() => setOpenDisclaimer(false)}
              className="font-arabic mr-2"
              style={{ fontWeight: 500, fontStyle: 'normal' }}
            >
              إلغاء
            </Button>
            <Button
              color="blue"
              onClick={proceedWithAction}
              className="font-arabic"
              style={{ fontWeight: 500, fontStyle: 'normal' }}
            >
              {selectedAction.type === "view" ? "مشاهدة الشهادة" : "تحميل الشهادة"}
            </Button>
        </DialogFooter>
      </Dialog>

      <footer className="py-2">
        <div className="text-center">
            <Typography
            variant="small"
            className="font-normal text-inherit text-center font-arabic"
            style={{ fontWeight: 500, fontStyle: 'normal' }}
          >
            المصمم المحترف &copy; 2025
          </Typography>
        </div>
      </footer>
    </>
  );
}
