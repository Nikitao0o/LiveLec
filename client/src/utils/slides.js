export const getSlideImageUrl = (lectureId, slideNumber, pinCode) => {
  if (!lectureId || !slideNumber) return null;
  const pinQuery = pinCode ? `?pin=${encodeURIComponent(pinCode)}` : '';
  return `/api/lectures/${lectureId}/slides/${slideNumber}${pinQuery}`;
};
