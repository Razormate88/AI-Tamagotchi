use tauri::{PhysicalPosition, PhysicalSize, WebviewWindow};

#[tauri::command]
pub fn reset_window_position(window: WebviewWindow) -> Result<(), String> {
    // Find the monitor to place the window on
    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| window.primary_monitor().ok().flatten())
        .ok_or_else(|| "No monitor found to position window".to_string())?;

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    // Standard reset size: 220x220 logical pixels
    let target_logical_size = 220.0;
    let target_phys_size = (target_logical_size * scale_factor) as u32;

    let _ = window.set_size(PhysicalSize::new(target_phys_size, target_phys_size));

    // Place safely in the lower-right area with 60px margin from screen edges
    let margin = (60.0 * scale_factor) as i32;
    let safe_x = monitor_pos.x + monitor_size.width as i32 - target_phys_size as i32 - margin;
    let safe_y = monitor_pos.y + monitor_size.height as i32 - target_phys_size as i32 - margin;

    window
        .set_position(PhysicalPosition::new(safe_x, safe_y))
        .map_err(|e| e.to_string())?;

    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();

    Ok(())
}
