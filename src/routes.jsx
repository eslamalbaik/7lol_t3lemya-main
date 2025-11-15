import {
  HomeIcon,
  RectangleStackIcon,
  BookmarkIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Home } from "@/pages/dashboard";
import { SignIn } from "@/pages/auth";
import AllCertificates from "./pages/dashboard/all_certificates";
import Clean from "./pages/dashboard/clean";
import GenerateCertificate from "./pages/dashboard/generate_certificate";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const routes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "الرئيسية",
        path: "/",
        element: <Home />,
      },
            {
        icon: <BookmarkIcon {...icon} />,
        name: "الشهادات",
        path: "/certificates",
        element: <AllCertificates />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "مولد الشهادات",
        path: "/add-certificate",
        element: <GenerateCertificate />,
      },
            {
        icon: <XMarkIcon {...icon} />,
        name: "حذف جميع الشهادات",
        path: "/clean",
        element: <Clean />,
      },
    ],
  },
];

export default routes;
