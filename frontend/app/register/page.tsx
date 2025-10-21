"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const signUpSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must have at least 2 characters!")
    .regex(/^[A-ZČĆŠĐŽ][a-zA-ZČĆŠĐŽčćšđž]*$/, "Invalid first name format!"),
  last_name: z
    .string()
    .min(2, "Last name must have at least 2 characters!")
    .regex(/^[A-ZŠČĆĐŽ][a-zA-ZČĆŠĐŽčćšđž]*$/, "Invalid last name format!"),
  username: z
    .string()
    .min(4, "Username must have at least 4 characters!")
    .regex(/^[a-zA-Z][a-zA-Z0-9._]*$/, "Invalid username format!"),
  email: z.string().email("Invalid email format!"),
  password: z.string().min(6, "Password must have at least 6 characters!"),
});

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/home");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      signUpSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.reduce((acc: any, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(formattedErrors);
      } else {
        console.error("Došlo je do greške:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-[#84b0ee]">
      <div className="absolute top-4 left-4 w-[10rem] md:w-[15rem]">
        <img src="/images/logo.png" className="w-full" />
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-gray-900 shadow-2xl w-11/12 sm:w-4/5 md:w-3/5 lg:w-1/2 mt-20">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-textColor">
          Registration
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {["first_name", "last_name", "username", "email", "password"].map(
              (field) => (
                <div key={field} className="col-span-1">
                  <input
                    type={field === "password" ? "password" : "text"}
                    name={field}
                    value={formData[field as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder={
                      field === "first_name"
                        ? "Name"
                        : field === "last_name"
                          ? "Surname"
                          : field === "username"
                            ? "Username"
                            : field === "email"
                              ? "Email"
                              : "Password"
                    }
                    title={
                      field === "first_name"
                        ? "The first name must have at least 2 characters and start with a capital letter!"
                        : field === "last_name"
                          ? "The last name must have at least 2 characters and start with a capital letter!"
                          : field === "username"
                            ? "The username must start with a letter and have at least 4 characters!"
                            : field === "email"
                              ? "Enter a valid email format (e.g. name@domain.com)"
                              : "The password must have at least 6 characters!"
                    }
                    className={`p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[field] ? "ring-2 ring-red-500" : "focus:ring-blue-500"} text-sm md:text-base`}
                    maxLength={field === "email" ? 50 : 20}
                    required
                  />

                  {errors[field] && (
                    <div className="text-red-700 text-xs font-semibold mt-1">
                      {errors[field]}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white w-full py-3 rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base"
          >
            Register
          </button>
        </form>
        <div className="mt-4 flex justify-center items-center text-gray-600">
          <p className="mr-2">Already have an account?</p>
          <button
            className="text-blue-500 hover:underline"
            onClick={() => router.push("/")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
