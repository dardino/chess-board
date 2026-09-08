
export function waitForMicroTask() {
  return new Promise(resolve => setTimeout(resolve, 0));
}
