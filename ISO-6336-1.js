/**
 * ISO 6336-1:2019 Calculations
 * Rating tab calculations (Basic principles, introduction and general influence factors)
 */

function calculatePower(torque, speed) {
    if (isNaN(torque) || isNaN(speed) || torque < 0 || speed < 0) {
        return { success: false, error: 'Invalid limits.' };
    }
    const power = (torque * speed * 2 * Math.PI) / 60000;
    return { success: true, value: power };
}
