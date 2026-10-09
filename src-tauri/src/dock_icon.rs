// `tauri dev` runs the raw binary, so set the Dock icon and name by hand.

#[cfg(target_os = "macos")]
const ICON_BYTES: &[u8] = include_bytes!("../icons/icon.icns");

#[cfg(target_os = "macos")]
const PRODUCT_NAME: &str = "KHM Tools";

#[cfg(target_os = "macos")]
pub fn apply() {
    use objc2::rc::autoreleasepool;
    use objc2::AnyThread;
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::{MainThreadMarker, NSData, NSProcessInfo, NSString};

    autoreleasepool(|_| {
        let Some(mtm) = MainThreadMarker::new() else {
            tracing::debug!("dock icon: not on main thread, skipping");
            return;
        };
        let app = NSApplication::sharedApplication(mtm);
        unsafe {
            let data = NSData::with_bytes(ICON_BYTES);
            let image = NSImage::initWithData(NSImage::alloc(), &data);
            if let Some(image) = image {
                app.setApplicationIconImage(Some(&image));
            } else {
                tracing::warn!("dock icon: failed to decode embedded icns");
            }

            let process_info = NSProcessInfo::processInfo();
            let name = NSString::from_str(PRODUCT_NAME);
            process_info.setProcessName(&name);
        }
    });
}

#[cfg(not(target_os = "macos"))]
pub fn apply() {}
