"use client";

import { Input } from "@nextui-org/input";
import React, { useState, useRef, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import axios from "axios";
import { RequestBody as BankDetail } from "@/app/api/bank/route";
import { RequestBody as UpiDetail } from "@/app/api/upi/route";
import { useRouter } from 'next/router';
type PaymentDetail = BankDetail & UpiDetail & { type: "bank" | "upi"; _id: string };
interface PaymentMethodProps {
  clientId: string;
  
}


export const PaymentMethodsContent: React.FC<PaymentMethodProps> = ({ clientId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); 
  const [formData, setFormData] = useState<BankDetail | UpiDetail>({
    beneficiaryName: "",
    clientId: clientId, // Initially set the clientId from the props
    // BankDetail specific fields
    accountNo: "",
    IFSCcode: "",
    bankName: "",
    upiId: "",
    qrCode: "",
    dailyLimit: "0",
    activeDays: ["Monday", "Tuesday"],
    activeMonths: ["January", "February"],
    isActive: true,
    rangeFrom: 0,
    rangeTo: 0,
  });
  
  // Add this useEffect to keep clientId in sync with props
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      clientId: clientId,
    }));
  }, [clientId]); // Ensure this runs whenever clientId changes
  

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editDetail, setEditDetail] = useState<PaymentDetail | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Determine if the formData is for UPI or Bank and set the tab accordingly

    if ("upiId" in formData && formData.upiId !== "") {
      setTabValue(0); // UPI tab
    } else if ("accountNo" in formData && formData.accountNo !== "") {
      setTabValue(1); // Bank tab
    }

    fetchPaymentDetails();
  }, [formData]);

  const fetchPaymentDetails = async () => {
    try {
      // Fetch both responses concurrently to reduce wait time
      const [bankResponse, upiResponse] = await Promise.all([
        axios.get("/api/bank",{ params: { clientId } }),
        axios.get("/api/upi", { params: { clientId } })  // Passing clientId as query parameter
      ]);

      // Check if responses have the expected structure
      const bankDetails = bankResponse?.data?.data || [];
      const upiDetails = upiResponse?.data?.data || [];

      // Combine both details with types
      const combinedDetails: PaymentDetail[] = [
        ...bankDetails.map((detail: BankDetail) => ({
          ...detail,
          type: "bank",
        })),
        ...upiDetails.map((detail: UpiDetail) => ({
          ...detail,
          type: "upi",
        })),
      ];

      // Set the combined payment details to the state
      setPaymentDetails(combinedDetails);

    } catch (error) {
      console.error("Error fetching payment details:", error);
      // Optionally, add user feedback here for better UX
    }
  };



  function isBankDetail(data: BankDetail | UpiDetail): data is BankDetail {
    return (data as BankDetail).accountNo !== undefined;
  }

  function isUpiDetail(data: BankDetail | UpiDetail): data is UpiDetail {
    return (data as UpiDetail).upiId !== undefined;
  }



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setFormData((prevData) => ({ ...prevData, qrCode: result.publicId }));
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);

  const handleCloseModal = ({ clientId }: { clientId: string }) => {
    setIsModalOpen(false);
    setEditMode(false);
    setEditDetail(null);
    
    // Update form data with the passed clientId and reset other fields
    setFormData({
      clientId: clientId, // Assign clientId
      beneficiaryName: "",
      accountNo: "", // BankDetail field
      IFSCcode: "", // BankDetail field
      bankName: "", // BankDetail field
      upiId: "", // UpiDetail field
      qrCode: "", // UpiDetail field
      dailyLimit: "0",
      activeDays: ["Monday", "Tuesday"],
      activeMonths: ["January", "February"],
      isActive: true,
      rangeFrom: 0,
      rangeTo: 0,
    });
  
    resetFormData(); // Call function to reset additional form states if needed
  };
  

  const resetFormData = () => {
    setFormData({
      clientId:clientId ,
      beneficiaryName: "",
      accountNo: "", // BankDetail field
      IFSCcode: "", // BankDetail field
      bankName: "", // BankDetail field
      upiId: "", // UpiDetail field
      qrCode: "", // UpiDetail field
      dailyLimit: "0",
      activeDays: ["Monday", "Tuesday"],
      activeMonths: ["January", "February"],
      isActive: true,
      rangeFrom: 0, rangeTo: 0
    });
  };

  const handleTabChange = (index: number) => {
    setTabValue(index);
    resetFormData();
  };

  
  const handleCreateBank = async () => {
    try {
      const response = await axios.post("/api/bank", formData);
      const newDetail = { ...response.data.data, type: "bank" } as PaymentDetail;
      setPaymentDetails([...paymentDetails, newDetail]);
      handleCloseModal({clientId});
    } catch (error) {
      console.error("Error creating bank details:", error);
    }
  };

  const handleCreateUpi = async () => {
    try {
      const response = await axios.post("/api/upi", formData);
      console.log(formData);
      const newDetail = { ...response.data.data, type: "upi" } as PaymentDetail;
      setPaymentDetails([...paymentDetails, newDetail]);
      handleCloseModal({clientId});
    } catch (error) {
      console.error("Error creating UPI details:", error);
    }
  };



  // Update Bank Details
  const handleUpdateBank = async () => {
    if (!editItemId) return; // Ensure editItemId (bankID) is set
  
    try {
      const response = await axios.put("/api/bank", {
        ...formData,
        bankID: editItemId,
        clientId:clientId  // Pass the bankID as part of the request
      });
      const updatedDetail = { ...response.data.data, type: "bank" } as PaymentDetail;
  
      const updatedPaymentDetails = paymentDetails.map((detail) =>
        detail._id === editItemId ? updatedDetail : detail
      );
      setPaymentDetails(updatedPaymentDetails);
      handleCloseModal({clientId}); // Close the modal after the update
    } catch (error) {
      console.error("Error updating bank details:", error);
    }
  };
  

// Update UPI Details
const handleUpdateUpi = async () => {
  if (!editItemId) return; // Ensure editItemId (upiId) is set

  try {
    const response = await axios.put("/api/upi", {
      ...formData,
      clientId:clientId
    // Pass the UPI ID as part of the request
    });

    const updatedDetail = { ...response.data.data, type: "upi" } as PaymentDetail;

    const updatedPaymentDetails = paymentDetails.map((detail) =>
      detail.upiId === editItemId ? updatedDetail : detail
    );
    setPaymentDetails(updatedPaymentDetails);
    handleCloseModal({clientId}); // Close the modal after the update
  } catch (error) {
    console.error("Error updating UPI details:", error);
  }
};


const handleEditDetail = (detail: PaymentDetail) => {
  setEditMode(true);
  setEditDetail(detail);

  // Set editItemId based on whether it's UPI or Bank
  if (detail.type === "upi") {
    setEditItemId(detail.upiId);  // Set UPI ID
  } else if (detail.type === "bank") {
    setEditItemId(detail._id);  // Set Bank ID (assumed to be _id)
  }

  setFormData(detail);  // Populate the form with the selected detail
  handleOpenModal();  // Open the modal
};


  const handleDeleteDetail = async (detail: PaymentDetail) => {
    console.log(paymentDetails);
    try {
      if (detail.type === "bank") {
        await axios.delete("/api/bank", {
          data: { bankId: detail._id, clientId: clientId }  // Pass the data in the config object under the 'data' property
        });
        
      } else {
        await axios.delete("/api/upi", {
          data: { 
            clientId: clientId, // Pass the client ID
            upiId: detail._id   // Pass the UPI ID to delete the specific UPI
          }
        });
        
      }
      setPaymentDetails(paymentDetails.filter((d) => d._id !== detail._id));
    } catch (error) {
      console.error("Error deleting detail:", error);
    }
  };

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-2">
      {/* Combined Payment Details Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-10 leading-5 text-primary">
          Active Payment Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentDetails
            .filter((detail) => detail.isActive)
            .map((detail, index) => (
              <div
                key={index}
                className="bg-white shadow-lg border border-black rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              //onClick={() => handleEditDetail(detail)}
              >
                <div className="flex flex-col items-start p-4">
                  <p className="text-paymentGrey text-xl font-semibold mb-1 leading-8">
                    {detail.beneficiaryName}
                  </p>
                  {detail.type === "bank" ? (
                    <>
                      <p className="text-paymentGrey font-semibold text-xl mb-1 leading-8">
                        {detail.accountNo}
                      </p>
                      <p className="text-paymentGrey font-semibold text-xl mb-1 leading-8">
                        {detail.IFSCcode}
                      </p>
                      <p className="text-paymentGrey font-semibold text-xl mb-1 leading-8">
                        {detail.bankName}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-paymentGrey font-semibold text-xl mb-1 leading-8">
                        {detail.upiId}
                      </p>
                      {detail.qrCode && (
                        <img
                          src={detail.qrCode}
                          alt="QR Code"
                          className="w-20 h-20 my-2"
                        />
                      )}
                    </>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      onClick={() => handleEditDetail(detail)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => handleDeleteDetail(detail)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          <div
            className="bg-white shadow-lg border border-black rounded-lg p-4 w-64 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={handleOpenModal}
          >
            <div className="flex flex-col items-center justify-center">
              <FaPlus className="text-black font-bold text-5xl mb-1 mt-10" />
              <span className="text-black text-xl leading-5 font-semibold">
                Add New
              </span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">
              {editMode ? "Edit Details" : "Add Details"}
            </h2>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-4">
              {editMode ? (
                <>
                  {/* Show UPI button if UPI details are valid */}
                  {isUpiDetail(formData) && (formData as UpiDetail)?.upiId?.trim() !== "" ? (
                    <button
                      className={`py-2 md:py-4 px-4 w-full rounded-xl border border-black ${"bg-primary text-black font-bold"
                        }`}
                      onClick={() => handleTabChange(0)}
                    >
                      QR/UPI Pay
                    </button>
                  ) : (
                    /* Show Bank button if UPI button is not shown and Bank details are valid */
                    (formData as BankDetail)?.accountNo?.trim() !== "" && (formData as BankDetail)?.IFSCcode?.trim() !== "" && (
                      <button
                        className={`py-2 md:py-4 px-4 w-full rounded-xl border border-black ${"bg-primary text-black font-bold"
                          }`}
                        onClick={() => handleTabChange(1)}
                      >
                        Bank Transfer
                      </button>
                    )
                  )}
                </>
              ) : (
                <>
                  {/* In non-edit mode, show both buttons without conditions */}
                  <button
                    className={`py-2 md:py-4 px-4 w-full rounded-xl border border-black ${tabValue === 0 ? "bg-primary text-black font-bold" : "bg-white text-gray-500"
                      }`}
                    onClick={() => handleTabChange(0)}
                  >
                    QR/UPI Pay
                  </button>
                  <button
                    className={`py-2 md:py-4 px-4 w-full rounded-xl border border-black ${tabValue === 1 ? "bg-primary text-black font-bold" : "bg-white text-gray-500"
                      }`}
                    onClick={() => handleTabChange(1)}
                  >
                    Bank Transfer
                  </button>
                </>
              )}
            </div>
            <form>
              {tabValue === 0 && (
                <div>
                  <div className="flex flex-col gap-4 mt-10">
                    <Input
                      name="upiId"
                      label="Enter UPI ID"
                      value={(formData as UpiDetail).upiId}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                    <Input
                      name="beneficiaryName"
                      label="Beneficiary Name"
                      value={formData.beneficiaryName}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                  </div>
                  <div className="flex flex-row items-center gap-4">
                    <div
                      className="bg-white shadow-lg border border-black rounded-lg p-4 w-28 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center mt-10"
                      onClick={handleCardClick}
                    >
                      <FaPlus className="text-black font-bold text-5xl mr-2" />
                      <input
                        type="file"
                        onChange={handleQrCodeUpload}
                        className="hidden"
                        ref={fileInputRef}
                      />
                      {(formData as UpiDetail).qrCode && (
                        <img
                          src={(formData as UpiDetail).qrCode}
                          alt="QR Code"
                          className="w-20 h-20"
                        />
                      )}
                    </div>
                    <p className="text-center text-gray-600">Upload QR Code</p>
                  </div>

                  <div className="mt-20">
                    <Input
                      name="dailyLimit"
                      label="Daily Limit"
                      value={formData.dailyLimit}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                  </div>

                  <div className="mt-5 flex space-x-4">
                    <div>
                      <Input
                        name="rangeFrom" // Corrected casing for consistency
                        label="Range from"
                        value={formData.rangeFrom.toString()} // Convert number to string
                        onChange={handleChange}
                        className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                        style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                      />
                    </div>

                    <div>
                      <Input
                        name="rangeTo" // Corrected casing for consistency
                        label="Range to"
                        value={formData.rangeTo.toString()} // Convert number to string
                        onChange={handleChange}
                        className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                        style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                      />
                    </div>
                  </div>

                </div>
              )}

              {tabValue === 1 && (
                <div>
                  <div className="flex flex-col gap-4 mt-10">
                    <Input
                      name="beneficiaryName"
                      label="Beneficiary Name"
                      value={formData.beneficiaryName}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                    <Input
                      name="accountNo"
                      label="Enter Account No"
                      value={(formData as BankDetail).accountNo}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                    <Input
                      name="reAccountNo"
                      label="Re-Enter Account No"
                      value={(formData as BankDetail).accountNo}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                    <Input
                      name="IFSCcode"
                      label="Enter IFSC Code"
                      value={(formData as BankDetail).IFSCcode}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                    <Input
                      name="bankName"
                      label="Enter Bank Name"
                      value={(formData as BankDetail).bankName}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                  </div>

                  <div className="mt-20">
                    <Input
                      name="dailyLimit"
                      label="Daily Limit"
                      value={formData.dailyLimit}
                      onChange={handleChange}
                      className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                      style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                    />
                  </div>
                  <div className="mt-5 flex space-x-4">
                    <div>
                      <Input
                        name="rangeFrom" // Corrected casing for consistency
                        label="Range from"
                        value={formData.rangeFrom.toString()} // Convert number to string
                        onChange={handleChange}
                        className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                        style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                      />
                    </div>

                    <div>
                      <Input
                        name="rangeTo" // Corrected casing for consistency
                        label="Range to"
                        value={formData.rangeTo.toString()} // Convert number to string
                        onChange={handleChange}
                        className="w-full text-xl bg-transparent rounded-xl border-1 border-black"
                        style={{ fontWeight: "bold", fontSize: "1.1rem" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>

            <div className="flex justify-between mt-8 gap-4 w-full">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prevData) => ({
                      ...prevData,
                      isActive: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <label>Active</label>
              </div>
              <button
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 border border-red-500 w-full"
                onClick={() => handleCloseModal({ clientId })}
              >
                Close
              </button>
          <button
            className="mt-4 bg-greenSubmit text-white px-4 py-2 rounded hover:bg-green-700 border-green-500 w-full"
            onClick={tabValue === 1 ? (editMode ? handleUpdateBank : handleCreateBank) : (editMode ? handleUpdateUpi : handleCreateUpi)}
          >
            {editMode ? "Update" : "Save"}
        </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
