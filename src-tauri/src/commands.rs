use tauri::{PhysicalPosition, PhysicalSize, WebviewWindow};

/// Logs concise native window state and monitor diagnostics to the terminal.
pub fn log_window_diagnostics(context: &str, window: &WebviewWindow) {
    let is_visible = window.is_visible().unwrap_or(false);
    let is_minimized = window.is_minimized().unwrap_or(false);
    let outer_pos = window.outer_position().ok();
    let outer_size = window.outer_size().ok();
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let monitor_info = window.current_monitor().ok().flatten().map(|m| {
        format!(
            "name={:?}, size={:?}, pos={:?}, scale={}",
            m.name(),
            m.size(),
            m.position(),
            m.scale_factor()
        )
    });

    println!(
        "[DIAGNOSTIC][Native] Context: {} | visible: {}, minimized: {}, pos: {:?}, size: {:?}, scale: {}, monitor: {:?}",
        context, is_visible, is_minimized, outer_pos, outer_size, scale_factor, monitor_info
    );
}

/// Robustly ensures the pet window is visible, unminimized, sized properly, and on an available monitor.
pub fn show_pet_authoritative(window: &WebviewWindow) -> Result<(), String> {
    let _ = window.unminimize();

    // Check if current geometry is valid and intersects an available monitor
    let is_geometry_valid =
        if let (Ok(pos), Ok(size)) = (window.outer_position(), window.outer_size()) {
            if size.width < 100 || size.height < 100 {
                false
            } else if let Ok(monitors) = window.available_monitors() {
                let mut onscreen = false;
                for mon in &monitors {
                    let mpos = mon.position();
                    let msize = mon.size();
                    let mon_x1 = mpos.x;
                    let mon_y1 = mpos.y;
                    let mon_x2 = mpos.x + msize.width as i32;
                    let mon_y2 = mpos.y + msize.height as i32;

                    let intersect_x1 = pos.x.max(mon_x1);
                    let intersect_y1 = pos.y.max(mon_y1);
                    let intersect_x2 = (pos.x + size.width as i32).min(mon_x2);
                    let intersect_y2 = (pos.y + size.height as i32).min(mon_y2);

                    if (intersect_x2 - intersect_x1) >= 50 && (intersect_y2 - intersect_y1) >= 50 {
                        onscreen = true;
                        break;
                    }
                }
                onscreen
            } else {
                false
            }
        } else {
            false
        };

    if !is_geometry_valid {
        println!("[DIAGNOSTIC][Native] Show Pet detected invalid/offscreen geometry. Repairing...");
        reset_window_position_authoritative(window)?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        let _ = window.set_focus();
        log_window_diagnostics("show_pet", window);
    }

    Ok(())
}

/// Authoritatively resets window position and size to standard safe visible bounds on screen.
pub fn reset_window_position_authoritative(window: &WebviewWindow) -> Result<(), String> {
    // Find the primary or current monitor
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten())
        .or_else(|| {
            window
                .available_monitors()
                .ok()
                .and_then(|m| m.into_iter().next())
        })
        .ok_or_else(|| "No monitor found to position window".to_string())?;

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    // Standard reset size: 220x220 logical pixels (Medium preset)
    let target_logical_size = 220.0;
    let target_phys_size = (target_logical_size * scale_factor).round() as u32;

    let _ = window.set_size(PhysicalSize::new(target_phys_size, target_phys_size));

    // Place safely in the lower-right area with 60px margin from screen edges
    let margin = (60.0 * scale_factor).round() as i32;
    let mut safe_x = monitor_pos.x + monitor_size.width as i32 - target_phys_size as i32 - margin;
    let mut safe_y = monitor_pos.y + monitor_size.height as i32 - target_phys_size as i32 - margin;

    // Ensure the window does not sit above or left of the monitor boundary
    if safe_x < monitor_pos.x {
        safe_x = monitor_pos.x + 20;
    }
    if safe_y < monitor_pos.y {
        safe_y = monitor_pos.y + 20;
    }

    window
        .set_position(PhysicalPosition::new(safe_x, safe_y))
        .map_err(|e| e.to_string())?;

    let _ = window.unminimize();
    window.show().map_err(|e| e.to_string())?;
    let _ = window.set_focus();

    log_window_diagnostics("reset_window_position", window);

    Ok(())
}

#[tauri::command]
pub fn reset_window_position(window: WebviewWindow) -> Result<(), String> {
    reset_window_position_authoritative(&window)
}

#[tauri::command]
pub fn show_pet(window: WebviewWindow) -> Result<(), String> {
    show_pet_authoritative(&window)
}

#[tauri::command]
pub fn report_frontend_stage(stage: String, details: Option<String>) {
    match details {
        Some(d) if !d.is_empty() => {
            println!("[DIAGNOSTIC][Frontend] Stage: {} ({})", stage, d);
        }
        _ => {
            println!("[DIAGNOSTIC][Frontend] Stage: {}", stage);
        }
    }
}

#[tauri::command]
pub fn report_frontend_error(stage: String, error: String) {
    eprintln!(
        "[DIAGNOSTIC][Frontend ERROR] Stage: {} | Error: {}",
        stage, error
    );
}
