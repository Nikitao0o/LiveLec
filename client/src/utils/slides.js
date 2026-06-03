export const getSlideImageUrl = (lectureId, slideNumber, pinCode) => {
  if (!lectureId || !slideNumber) return null;
  const params = new URLSearchParams();
  if (pinCode) params.set('pin', String(pinCode));
  params.set('v', String(slideNumber));
  return `/api/lectures/${lectureId}/slides/${slideNumber}?${params.toString()}`;
};
