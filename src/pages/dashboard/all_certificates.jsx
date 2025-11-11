// src/pages/AllCertificates.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardBody,
  Typography, Input, Button, IconButton,
  Dialog, DialogHeader, DialogBody, DialogFooter,
} from "@material-tailwind/react";
import {
  MagnifyingGlassIcon, EyeIcon, ArrowDownTrayIcon,
  TrashIcon, DocumentTextIcon, XMarkIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import Upload from "@/widgets/Upload";
import api from "@/configs/api";
import { toast } from "react-toastify";

// Material-UI imports
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";

export default function AllCertificates() {
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState("");
  const [certQuery, setCertQuery] = useState("");
  const [certResult, setCertResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState("view");
  const [deletingStud, setDeletingStud] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGroupKeys, setSelectedGroupKeys] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchCertificates();
  }, [pagination.page, pagination.limit]);

  const fetchCertificates = async () => {
    setLoading(true);
    let mappedGroups = [];
    try {
      const { data } = await api.get(
        `/certificates?page=${pagination.page}&limit=${pagination.limit}`
      );

      const allCerts = data.data || [];
      const map = new Map();
      allCerts.forEach((c) => {
        const key = c.studentId || c.certificateNumber || c._id;
        if (!map.has(key)) {
          map.set(key, {
            groupKey: key,
            studentId: c.studentId || null,
            displayId: c.studentId || c.certificateNumber || c._id,
            certificates: [],
          });
        }
        map.get(key).certificates.push(c);
      });

      mappedGroups = Array.from(map.values()).map((entry) => ({
        ...entry,
        certCount: entry.certificates.length,
      }));

      setGroups(mappedGroups);
      setSelected((prev) =>
        prev
          ? mappedGroups.find((g) => g.groupKey === prev.groupKey) || prev
          : prev
      );
      setSelectedGroupKeys((prev) =>
        prev.filter((key) => mappedGroups.some((g) => g.groupKey === key))
      );

      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
    return mappedGroups;
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const filtered = useMemo(
    () =>
      filter
        ? groups.filter((g) =>
            (g.displayId || "").toString().includes(filter.trim())
          )
        : groups,
    [groups, filter]
  );

  useEffect(() => {
    setSelectedGroupKeys((prev) =>
      prev.filter((key) => filtered.some((g) => g.groupKey === key))
    );
  }, [filtered]);

  const isAllSelected =
    filtered.length > 0 &&
    filtered.every((g) => selectedGroupKeys.includes(g.groupKey));

  const toggleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedGroupKeys(filtered.map((g) => g.groupKey));
    } else {
      setSelectedGroupKeys([]);
    }
  };

  const toggleSelectStudent = (groupKey) => {
    setSelectedGroupKeys((prev) =>
      prev.includes(groupKey)
        ? prev.filter((key) => key !== groupKey)
        : [...prev, groupKey]
    );
  };

  const openDialogFor = (group, initialMode) => {
    setSelected(group);
    setMode(initialMode);
    setOpenDialog(true);
  };

  const searchByCertificateNumber = async () => {
    const num = certQuery.trim();
    if (!num) return;
    try {
      const { data } = await api.get('/certificates/verify', { params: { certificate: num } });
      if (data?.valid && data?.certificate) {
        setCertResult(data.certificate);
      } else {
        setCertResult(null);
        toast.error('لم يتم العثور على شهادة بهذا الرقم');
      }
    } catch (err) {
      console.error(err);
      setCertResult(null);
      toast.error('تعذر البحث عن الشهادة');
    }
  };

  const deleteGroupOnServer = async (group) => {
    const { studentId, certificates } = group || {};

    if (studentId) {
      await api.delete(`/certificates/student/${studentId}`);
      return { success: true };
    }

    if (!certificates?.length) {
      return { success: false, message: "لا توجد شهادات مرتبطة بهذا السجل" };
    }

    const results = await Promise.allSettled(
      certificates.map((cert) => api.delete(`/certificates/${cert._id}`))
    );

    const failedCount = results.filter((r) => r.status === "rejected").length;

    if (failedCount > 0) {
      return {
        success: false,
        message: `تعذر حذف ${failedCount} شهادة مرتبطة بهذا الطالب`,
      };
    }

    return { success: true };
  };

  const handleDeleteStudent = async (group) => {
    if (!group) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب وكل شهاداته؟")) return;
    setDeletingStud(true);
    try {
      const result = await deleteGroupOnServer(group);
      if (!result.success) {
        toast.error(result.message || "تعذر حذف الطالب، حاول لاحقًا");
        return;
      }

      setGroups((prev) => prev.filter((g) => g.groupKey !== group.groupKey));
      setSelectedGroupKeys((prev) =>
        prev.filter((key) => key !== group.groupKey)
      );
      if (selected?.groupKey === group.groupKey) {
        setOpenDialog(false);
        setSelected(null);
      }
      toast.success("تم حذف الطالب بنجاح");
      fetchCertificates();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حذف الطالب");
    } finally {
      setDeletingStud(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGroupKeys.length === 0) return;
    if (!window.confirm("هل تريد حذف كل الطلاب المحددين وشهاداتهم؟")) return;

    setBulkDeleting(true);
    const keysToDelete = [...selectedGroupKeys];
    const groupsToDelete = keysToDelete
      .map((key) => groups.find((g) => g.groupKey === key))
      .filter(Boolean);

    try {
      const successKeys = [];
      const failedMessages = [];

      for (const group of groupsToDelete) {
        try {
          const result = await deleteGroupOnServer(group);
          if (result.success) {
            successKeys.push(group.groupKey);
          } else {
            failedMessages.push(result.message || group.displayId || group.groupKey);
          }
        } catch (err) {
          console.error(err);
          failedMessages.push(group.displayId || group.groupKey);
        }
      }

      if (successKeys.length > 0) {
        setGroups((prev) => prev.filter((g) => !successKeys.includes(g.groupKey)));
        setSelectedGroupKeys((prev) =>
          prev.filter((key) => !successKeys.includes(key))
        );
        if (selected && successKeys.includes(selected.groupKey)) {
          setOpenDialog(false);
          setSelected(null);
        }
        toast.success(
          `تم حذف ${successKeys.length} طالب${
            successKeys.length === 1 ? "" : "ًا"
          } بنجاح`
        );
      }

      if (failedMessages.length > 0) {
        toast.error(
          `تعذر حذف ${failedMessages.length} طالب، يرجى المحاولة لاحقًا`
        );
      }

      if (successKeys.length > 0) {
        fetchCertificates();
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حذف الطلاب المحددين");
    } finally {
      setBulkDeleting(false);
    }
  };

  const onUploaded = (newCerts) => {
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            certCount: prev.certCount + newCerts.length,
            certificates: [...newCerts, ...prev.certificates],
          }
        : prev
    );
    setGroups((prev) =>
      prev.map((g) =>
        selected && g.groupKey === selected.groupKey
          ? {
              ...g,
              certCount: g.certCount + newCerts.length,
              certificates: [...newCerts, ...g.certificates],
            }
          : g
      )
    );
  };

  const getDownloadUrl = (url) =>
    url.replace("/upload/", "/upload/fl_attachment/");

  const triggerDownload = (url, filename = "certificate.pdf") => {
    if (!url) return;
    const downloadUrl = url.includes("/upload/") ? getDownloadUrl(url) : url;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCert = async (certId) => {
    if (!window.confirm("هل تريد حذف هذه الشهادة؟")) return;
    if (!selected?.certificates) return;
    try {
      await api.delete(`/certificates/${certId}`);
      const updatedCerts = selected.certificates.filter((c) => c._id !== certId);
      if (updatedCerts.length === 0) {
        setGroups((prev) =>
          prev.filter((g) => g.groupKey !== selected.groupKey)
        );
        setSelectedGroupKeys((prev) =>
          prev.filter((key) => key !== selected.groupKey)
        );
        setOpenDialog(false);
        setSelected(null);
      } else {
        setSelected((prev) =>
          prev ? { ...prev, certCount: prev.certCount - 1, certificates: updatedCerts } : prev
        );
        setGroups((prev) =>
          prev.map((g) =>
            g.groupKey === selected.groupKey
              ? { ...g, certCount: g.certCount - 1, certificates: updatedCerts }
              : g
          )
        );
      }
      toast.success("تم حذف الشهادة");
      fetchCertificates();
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء حذف الشهادة");
    }
  };

  return (
    <>
      <div className="relative mt-8 h-72 w-full rounded-xl bg-cover bg-center bg-[url('/img/background-image.png')]">
        <div className="absolute inset-0 bg-gray-900/75" />
      </div>

      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border shadow">
        <CardHeader className="p-4 text-right">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Typography variant="h2" className="font-arabic flex-1">
              إدارة الطلاب والشهادات
            </Typography>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="flex items-center gap-x-2">
                <Input
                  label="معرف الطالب"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="font-arabic"
                />
                <Button
                  onClick={() => {
                    const grp = groups.find(
                      (g) => (g.displayId || "").toString() === filter.trim()
                    );
                    if (grp) openDialogFor(grp, "view");
                  }}
                  disabled={!filter.trim()}
                  color="blue"
                  className="flex items-center gap-x-2 font-arabic"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                  بحث
                </Button>
              </div>
              <div className="flex items-center gap-x-2">
                <Input
                  label="رقم الشهادة"
                  value={certQuery}
                  onChange={(e) => setCertQuery(e.target.value)}
                  className="font-arabic"
                />
                <Button
                  onClick={searchByCertificateNumber}
                  disabled={!certQuery.trim()}
                  color="green"
                  className="flex items-center gap-x-2 font-arabic"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                  تحقق من الشهادة
                </Button>
              </div>
              <Button
                color="red"
                variant="outlined"
                disabled={selectedGroupKeys.length === 0 || bulkDeleting}
                onClick={handleDeleteSelected}
                className="font-arabic"
              >
                {bulkDeleting ? "جارٍ حذف المحددين..." : "حذف المحددين"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="px-4 pb-4">
          <TableContainer component={Paper} sx={{ minHeight: 400 }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell padding="checkbox" align="center">
                    <Checkbox
                      color="primary"
                      checked={isAllSelected}
                      indeterminate={
                        selectedGroupKeys.length > 0 && !isAllSelected
                      }
                      onChange={toggleSelectAll}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }} >
                    <Typography variant="h6" className="font-arabic flex-1">
                       معرف الطالب
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    <Typography variant="h6" className="font-arabic flex-1">
                       عدد الشهادات
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    <Typography variant="h6" className="font-arabic flex-1">
                       إجراءات
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                  <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                  <TableCell colSpan={4} align="center">
                      لا توجد بيانات للعرض
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((g) => (
                    <TableRow 
                      key={g.groupKey}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell padding="checkbox" align="center">
                        <Checkbox
                          color="primary"
                          checked={selectedGroupKeys.includes(g.groupKey)}
                          onChange={() => toggleSelectStudent(g.groupKey)}
                        />
                      </TableCell>
                      <TableCell align="center">{g.displayId}</TableCell>
                      <TableCell align="center">{g.certCount}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Button
                            variant="outlined"
                            color="blue"
                            onClick={() =>
                              openDialogFor(g, "view")
                            }
                            className="font-arabic"
                          >
                            شهادات
                          </Button>
                          <Button
                            variant="outlined"
                            color="red"
                            onClick={() => handleDeleteStudent(g)}
                            disabled={deletingStud}
                            className="font-arabic"
                          >
                            حذف طالب
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {certResult && (
            <Card className="mt-6 border border-green-200 bg-green-50/70 shadow-sm">
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Typography variant="h5" className="font-arabic text-green-700">
                    تم التحقق من الشهادة بنجاح
                  </Typography>
                  <Typography variant="small" className="text-gray-600 font-arabic">
                    رقم الشهادة: {certResult.certificateNumber}
                  </Typography>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right font-arabic">
                  <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                    <Typography color="gray" className="text-sm">اسم المتدرب</Typography>
                    <Typography className="font-semibold text-blue-gray-900">
                      {certResult.studentName || certResult.traineeName || "—"}
                    </Typography>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                    <Typography color="gray" className="text-sm">اسم الدورة</Typography>
                    <Typography className="font-semibold text-blue-gray-900">
                      {certResult.courseName || "—"}
                    </Typography>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-green-100">
                    <Typography color="gray" className="text-sm">اسم المدرب</Typography>
                    <Typography className="font-semibold text-blue-gray-900">
                      {certResult.trainerName || "—"}
                    </Typography>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    color="blue"
                    variant="outlined"
                    onClick={() =>
                      window.open(certResult.pdfUrl || certResult.certificateUrl, "_blank")
                    }
                    className="font-arabic"
                  >
                    عرض الشهادة
                  </Button>
                  <Button
                    color="green"
                    onClick={() =>
                      triggerDownload(
                        certResult.pdfUrl || certResult.certificateUrl,
                        `certificate-${certResult.certificateNumber || "download"}.pdf`
                      )
                    }
                    className="font-arabic"
                  >
                    تنزيل الشهادة
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {!loading && pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Stack spacing={2}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Stack>
            </Box>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={openDialog}
        size="lg"
        handler={() => {
          setOpenDialog(false);
          setSelected(null);
        }}
        className="font-arabic"
      >
        <DialogHeader className="bg-blue-gray-50">
          <Typography variant="h5" className="font-arabic">
            شهادات الطالب: {selected?.displayId || "—"}
          </Typography>
          <IconButton
            variant="text"
            color="gray"
            className="ml-auto"
            onClick={() => {
              setOpenDialog(false);
              setSelected(null);
            }}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        </DialogHeader>
        <DialogBody divider className="space-y-4">
          {mode === "add" && (
            <Upload
              studentId={selected?.studentId}
              onUploaded={onUploaded}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {selected?.certificates?.map((cert, idx) => (
              <Card
                key={cert._id}
                className="relative border rounded-lg p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow bg-white"
              >
                <Typography variant="small" className="absolute top-2 left-2 text-gray-500">
                  {new Date(cert.createdAt).toLocaleDateString("ar-EG")}
                </Typography>
                <div className="flex flex-col items-center gap-2 mt-4">
                  <DocumentTextIcon className="h-12 w-12 text-blue-500" />
                  <Typography variant="h6">
                    شهادة {idx + 1}
                  </Typography>
                </div>
                <div className="w-full text-right font-arabic bg-blue-gray-50/60 border border-blue-gray-100 rounded-lg p-3">
                  <div className="text-sm text-blue-gray-600">اسم الدورة</div>
                  <div className="font-semibold text-blue-gray-900">
                    {cert.courseName || "—"}
                  </div>
                  {cert.trainerName && (
                    <div className="mt-2">
                      <div className="text-sm text-blue-gray-600">اسم المدرب</div>
                      <div className="font-semibold text-blue-gray-900">
                        {cert.trainerName}
                      </div>
                    </div>
                  )}
                </div>
                <Box display="flex" justifyContent="center" gap={2} className="mt-auto">
                  <IconButton
                    color="blue"
                    onClick={() => window.open(cert.pdfUrl || cert.certificateUrl, '_blank')}
                  >
                    <EyeIcon className="h-5 w-5" />
                  </IconButton>
                  <IconButton
                    color="green"
                    onClick={() =>
                      triggerDownload(
                        cert.pdfUrl || cert.certificateUrl,
                        `certificate-${cert.certificateNumber || idx + 1}.pdf`
                      )
                    }
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </IconButton>
                  <IconButton
                    color="red"
                    onClick={() => handleDeleteCert(cert._id)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </IconButton>
                </Box>
              </Card>
            ))}
            {selected?.certificates?.length === 0 && (
              <Typography className="text-center text-gray-500 py-8">
                لا توجد شهادات لهذا الطالب
              </Typography>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="bg-blue-gray-50">
          <Button
            variant="gradient"
            color="blue"
            onClick={() => {
              setOpenDialog(false);
              setSelected(null);
            }}
            className="font-arabic"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}