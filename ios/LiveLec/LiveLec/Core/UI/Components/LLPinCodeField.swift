import SwiftUI

struct LLPinCodeField: View {
    @Binding var pin: String
    @FocusState private var isInputFocused: Bool

    var body: some View {
        VStack(spacing: 12) {
            TextField("", text: $pin)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($isInputFocused)
                .opacity(0.01)
                .frame(width: 1, height: 1)
                .onChange(of: pin) { _, newValue in
                    pin = String(newValue.filter(\.isNumber).prefix(6))
                }

            HStack(spacing: 10) {
                ForEach(0..<6, id: \.self) { index in
                    let characters = Array(pin)
                    let value = index < characters.count ? String(characters[index]) : "–"
                    let isActive = index == max(pin.count - 1, 0) && !pin.isEmpty

                    Text(value)
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(index < pin.count ? LLColors.primary : LLColors.textSecondary)
                        .frame(width: 48, height: 58)
                        .background(LLColors.surface)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay {
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(isActive ? LLColors.primary : LLColors.border, lineWidth: 1.5)
                        }
                }
            }
            .contentShape(Rectangle())
            .onTapGesture {
                isInputFocused = true
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("PIN-код")
            .accessibilityValue(pin.isEmpty ? "Не введен" : pin)
        }
        .onAppear {
            isInputFocused = true
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Готово") {
                    isInputFocused = false
                    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
                }
            }
        }
    }
}

