"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cropper, { Area } from "react-easy-crop";
import { LoaderIcon, Eye, EyeOff } from "lucide-react";
import { FiArrowLeft } from "react-icons/fi";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { FiUser } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountFormValues } from "@/types/accounts";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

// ---------- crop helpers ----------
async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: Area
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob), "image/jpeg")
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// ---- Format Phone --------
const formatThaiPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (!match) return digits;
  return [match[1], match[2], match[3]].filter(Boolean).join("-");
};

export default function AccountForm() {

  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AccountFormValues>({
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      birthDate: "",
      avatar: null,
    },
  });

  useEffect(() => {
    setError("");
    setLoading(false);
  }, []);

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    if (!croppedBlob) return;

    const croppedFile = new File(
      [croppedBlob],
      selectedFile?.name || "avatar.jpg",
      { type: "image/jpeg" }
    );
    form.setValue("avatar", croppedFile, { shouldValidate: true });
    setImageSrc(URL.createObjectURL(croppedFile));
    setIsCropModalOpen(false);
  };

  const onSubmit: SubmitHandler<AccountFormValues> = async (data) => {
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value == null || value === "") return;

        if (key === "avatar" && value instanceof File) {
          formData.append("avatar", value);
          return;
        }

        // ✅ map field ให้ตรง backend
        const keyMap: Record<string, string> = {
          firstName: "first_name",
          lastName: "last_name",
          birthDate: "birthday",
        };

        const backendKey =
          keyMap[key] ??
          key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`).toLowerCase();

        formData.append(backendKey, value as string);
      });

      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || "Failed to create account";
        console.error("CREATE ERROR:", errorData);
        setError(message);
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Network error: Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
       <div className="m-2">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.back()}
              >
                <FiArrowLeft /> Back
              </Button>
            </div>
      <Card className="max-w-6xl mx-auto mt-20 p-6">
        <CardHeader className="text-center mt-5">
          <CardTitle className="text-4xl font-bold">Create Account</CardTitle>
        </CardHeader>

        <CardContent>
          {loading || isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <LoaderIcon className="h-10 w-10 animate-spin text-gray-500" />
              <p className="text-gray-500 text-lg">
                {loading ? "Loading user data..." : "Updating data..."}
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-lg">
              {error}
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 mt-6"
            >
              {/* ================= Avatar ================= */}
              <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                <div className="flex-shrink-0 w-full md:w-[320px] flex flex-col items-center">
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <div
                            {...getRootProps()}
                            className={`border-2 border-dashed cursor-pointer flex items-center justify-center mt-10 rounded-full overflow-hidden relative ${
                              isDragActive
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300"
                            }`}
                            style={{
                              width: "100%",
                              maxWidth: 300,
                              aspectRatio: "1 / 1",
                              minHeight: 300,
                              position: "relative",
                            }}
                          >
                            <input {...getInputProps()} />

                            {imageSrc ? (
                              <Image
                                src={imageSrc}
                                alt="Avatar"
                                fill
                                className="rounded-full object-cover"
                                style={{ objectPosition: "center center" }}
                              />
                            ) : (
                              <FiUser size={100} className="text-gray-400" />
                            )}
                          </div>
                        </FormControl>

                        <Button
                          type="button"
                          className="bg-black text-white rounded px-4 py-2 mt-5 w-full max-w-[300px]"
                          onClick={() =>
                            document
                              .querySelector<HTMLInputElement>(
                                'input[type="file"]'
                              )
                              ?.click()
                          }
                        >
                          Upload Image
                        </Button>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ================= Personal Info ================= */}
                <div className="flex-grow space-y-8 w-full">
                  {/* Username & Email */}
                  <FormField
                    control={form.control}
                    name="username"
                    rules={{ required: "Username is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold" >Username</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Username" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address",
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ required: "Password is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              className="pr-12"
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* First & Last Name */}
                  <div className="grid gap-8 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      rules={{ required: "First name is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">First Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="First Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      rules={{ required: "Last name is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Last Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone & Birth Date */}
                  <div className="grid gap-8 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={
                                field.value ? formatThaiPhone(field.value) : ""
                              }
                              placeholder="Phone number"
                              className="text-xl p-3 font-medium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      rules={{
                        required: "Birth date is required",
                        validate: (value) =>
                          !value
                            ? "Birth date is required"
                            : new Date(value) > new Date()
                            ? "Birth date cannot be in the future"
                            : true,
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold">Birth Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Gender */}
                  <FormField
                    control={form.control}
                    name="gender"
                    rules={{ required: "Gender is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">Gender</FormLabel>
                        <FormControl>
                          <div className="flex gap-6 flex-wrap">
                            {["male", "female", "other"].map((value) => (
                              <label
                                key={value}
                                className="inline-flex items-center space-x-3 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  value={value}
                                  checked={field.value === value}
                                  onChange={() => field.onChange(value)}
                                  className="form-radio w-6 h-6"
                                />
                                <span className="capitalize">{value}</span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ================= Submit ================= */}
              <div className="flex justify-center mt-10">
                <Button type="submit" className="text-lg px-10 py-4" disabled={isSubmitting}>
                  Create Account
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ================= Modal Crop ================= */}
      {isCropModalOpen && imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div style={{ position: "relative", width: "100%", height: 400 }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                minZoom={1}
                maxZoom={5}
              />
            </div>
            <div className="mt-4 flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setIsCropModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCropConfirm}>Confirm Crop</Button>
            </div>
          </div>
        </div>
      )}
    </Form>
  );
}
