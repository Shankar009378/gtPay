import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@nextui-org/navbar";
import NextLink from "next/link";
import Image from "next/image";
import { useState } from "react"; // Import useState for dropdown selection

interface NavbarProps {
  showTransactionId?: boolean;
  transactionId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ showTransactionId = true, transactionId }) => {
  const [selectedClient, setSelectedClient] = useState("client1"); // State to manage the selected client

  const handleClientChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClient(event.target.value);
  };

  return (
    <NextUINavbar
      maxWidth="xl"
      position="sticky"
      className="shadow-md p-0 m-0 w-full h-auto flex items-center justify-between"
      style={{ padding: 0, margin: 0 }}
    >
      {/* Flexbox container for navbar content */}
      <div className="flex items-center p-0 m-0" style={{ flexShrink: 0 }}>
        <NextLink href="/" className="flex items-center p-0 m-0">
          <Image
            src="/logo.png" // Replace with actual logo path
            alt="OTPay Logo"
            width={150}
            height={150}
            className="object-contain p-0 m-0"
            style={{ paddingLeft: 0, marginLeft: 0 }}
          />
        </NextLink>
      </div>

      {/* Dropdown beside the logo */}
      <div className="ml-4">
        <select
          className="p-2 border rounded text-black"
          value={selectedClient}
          onChange={handleClientChange}
        >
          <option value="client1">Client 1</option>
          <option value="client2">Client 2</option>
          <option value="client3">Client 3</option>
        </select>
      </div>

      <div className="flex-grow"></div>

      {/* Conditionally render the transactionId if showTransactionId is true */}
      {showTransactionId && transactionId && (
        <div className="hidden sm:flex justify-end p-0 m-0">
          <NavbarItem className="hidden md:flex gap-3">
            <span className="text-black font-bold">Transaction Id: {transactionId}</span>
          </NavbarItem>
        </div>
      )}

      {/* Mobile menu toggle */}
      <div className="sm:hidden p-0 m-0">
        <NavbarMenuToggle className="text-black" />
      </div>
    </NextUINavbar>
  );
};