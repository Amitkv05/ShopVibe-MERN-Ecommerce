import User from "../models/userModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

export const listAddresses = handleAsyncError(async (req, res) => res.json({ success: true, addresses: req.user.addresses }));
export const addAddress = handleAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault || user.addresses.length === 0) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push({ ...req.body, isDefault: req.body.isDefault || user.addresses.length === 0 });
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
});
export const updateAddress = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) return next(new HandleError("Address not found", 404));
  if (req.body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  Object.assign(address, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});
export const deleteAddress = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);
  if (!address) return next(new HandleError("Address not found", 404));
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses[0]) user.addresses[0].isDefault = true;
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});
