import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export default function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
